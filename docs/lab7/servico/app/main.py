"""API REST do Serviço de Propostas de Orientação (OrientaTCC)."""
from __future__ import annotations

from typing import List, Optional

from fastapi import Depends, FastAPI, Header, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .dominio import Ator, ErroDominio, NaoAutenticado, Perfil, Proposta, SituacaoProposta, TrabalhoTCC
from .esquemas import (ErroSaida, EventoSaida, LimiteOrientandosSaida, PropostaSaida,
                       RespostaPropostaSaida, ResponderPropostaEntrada,
                       SubmeterPropostaEntrada, TrabalhoSaida)
from .eventos import BarramentoEventos
from .repositorio import RepositorioMemoria, carregar_dados_demonstracao
from .servico import ServicoPropostas

ERROS = {
    400: {"model": ErroSaida, "description": "Requisição malformada"},
    401: {"model": ErroSaida, "description": "Ator não autenticado"},
    403: {"model": ErroSaida, "description": "Perfil ou participação não permitidos"},
    404: {"model": ErroSaida, "description": "Recurso não encontrado"},
    409: {"model": ErroSaida, "description": "Conflito com a situação atual"},
    422: {"model": ErroSaida, "description": "Entrada inválida ou regra de negócio violada"},
}


def _proposta(p: Proposta) -> PropostaSaida:
    return PropostaSaida(id=p.id, alunoId=p.aluno_id, orientadorId=p.orientador_id, tema=p.tema,
                         resumo=p.resumo, objetivos=p.objetivos, areaPesquisa=p.area_pesquisa,
                         situacao=p.situacao, submetidaEm=p.submetida_em,
                         respondidaEm=p.respondida_em, decisao=p.decisao,
                         justificativa=p.justificativa, trabalhoId=p.trabalho_id)


def _trabalho(t: Optional[TrabalhoTCC]) -> Optional[TrabalhoSaida]:
    if t is None:
        return None
    return TrabalhoSaida(id=t.id, propostaId=t.proposta_id, alunoId=t.aluno_id,
                         orientadorId=t.orientador_id, situacao=t.situacao, iniciadoEm=t.iniciado_em)


def _traduzir(e: dict) -> str:
    """Mensagens de validação em português."""
    ctx = e.get("ctx") or {}
    return {
        "missing": "campo obrigatório",
        "string_too_short": f"deve ter pelo menos {ctx.get('min_length')} caractere(s)",
        "string_too_long": f"deve ter no máximo {ctx.get('max_length')} caracteres",
        "enum": f"valor inválido; use {ctx.get('expected')}".replace(" or ", " ou "),
        "extra_forbidden": "campo não permitido",
        "string_type": "deve ser texto",
        "json_invalid": "JSON malformado",
        "model_attributes_type": "o corpo deve ser um objeto JSON",
    }.get(e["type"], e["msg"])


def obter_ator(x_usuario_id: Optional[str] = Header(default=None, description="Identificador do usuário autenticado"),
               x_perfil: Optional[str] = Header(default=None, description="aluno | orientador")) -> Ator:
    """ACL de Identidade e Acesso: traduz a sessão para o Ator {usuarioId, perfil}.

    No OrientaTCC a sessão vem do Better Auth; neste serviço isolado ela é
    simulada pelos cabeçalhos X-Usuario-Id e X-Perfil.
    """
    if not x_usuario_id or not x_perfil:
        raise NaoAutenticado("Cabeçalhos X-Usuario-Id e X-Perfil são obrigatórios.")
    try:
        perfil = Perfil(x_perfil.strip().lower())
    except ValueError:
        raise NaoAutenticado("Perfil inválido: use 'aluno' ou 'orientador'.", "PERFIL_INVALIDO")
    return Ator(x_usuario_id.strip(), perfil)


def criar_app(repo: RepositorioMemoria | None = None) -> FastAPI:
    repo = repo or carregar_dados_demonstracao(RepositorioMemoria())
    barramento = BarramentoEventos()
    servico = ServicoPropostas(repo, barramento)

    app = FastAPI(
        title="OrientaTCC — Serviço de Propostas de Orientação",
        version="1.0.0",
        description=("Serviço do Bounded Context Propostas (domínio Core) do OrientaTCC. "
                     "Disponibiliza as capacidades submeterProposta, consultarProposta, "
                     "listarPropostas, verificarLimiteOrientandos e responderProposta."),
    )
    app.state.repo, app.state.barramento, app.state.servico = repo, barramento, servico

    @app.exception_handler(ErroDominio)
    async def _erro_dominio(_: Request, exc: ErroDominio):
        return JSONResponse(status_code=exc.status,
                            content={"erro": {"codigo": exc.codigo, "mensagem": exc.mensagem}})

    @app.exception_handler(RequestValidationError)
    async def _erro_validacao(_: Request, exc: RequestValidationError):
        detalhes = [{"campo": ".".join(str(x) for x in e["loc"] if x != "body"),
                     "problema": _traduzir(e)} for e in exc.errors()]
        return JSONResponse(status_code=422, content={"erro": {
            "codigo": "DADOS_INVALIDOS", "mensagem": "Os dados de entrada são inválidos.",
            "detalhes": detalhes}})

    @app.post("/propostas", status_code=201, response_model=PropostaSaida, responses=ERROS,
              tags=["Propostas"], summary="submeterProposta")
    def submeter_proposta(dados: SubmeterPropostaEntrada, ator: Ator = Depends(obter_ator)):
        """Aluno submete uma proposta (tema, resumo, objetivos e área de pesquisa) a um orientador."""
        p = servico.submeter_proposta(ator, orientador_id=dados.orientadorId, tema=dados.tema,
                                      resumo=dados.resumo, objetivos=dados.objetivos,
                                      area_pesquisa=dados.areaPesquisa)
        return _proposta(p)

    @app.get("/propostas", response_model=List[PropostaSaida], responses=ERROS,
             tags=["Propostas"], summary="listarPropostas")
    def listar_propostas(situacao: Optional[SituacaoProposta] = Query(default=None),
                         ator: Ator = Depends(obter_ator)):
        """Aluno: propostas que submeteu. Orientador: propostas recebidas."""
        return [_proposta(p) for p in servico.listar_propostas(ator, situacao)]

    @app.get("/propostas/{propostaId}", response_model=PropostaSaida, responses=ERROS,
             tags=["Propostas"], summary="consultarProposta")
    def consultar_proposta(propostaId: str, ator: Ator = Depends(obter_ator)):
        return _proposta(servico.consultar_proposta(ator, propostaId))

    @app.post("/propostas/{propostaId}/resposta", response_model=RespostaPropostaSaida,
              responses=ERROS, tags=["Propostas"], summary="responderProposta")
    def responder_proposta(propostaId: str, dados: ResponderPropostaEntrada,
                           ator: Ator = Depends(obter_ator)):
        """Orientador destinatário aceita, devolve para ajustes ou recusa a proposta."""
        r = servico.responder_proposta(ator, propostaId, dados.decisao, dados.justificativa)
        ev = r.evento
        return RespostaPropostaSaida(
            proposta=_proposta(r.proposta), trabalho=_trabalho(r.trabalho),
            eventoPublicado=EventoSaida(evento=ev.evento, versao=ev.versao, ocorridoEm=ev.ocorrido_em,
                                        trabalhoId=ev.trabalho_id, dados=ev.dados))

    @app.get("/orientadores/{orientadorId}/limite-orientandos", response_model=LimiteOrientandosSaida,
             responses=ERROS, tags=["Orientadores"], summary="verificarLimiteOrientandos")
    def verificar_limite(orientadorId: str, ator: Ator = Depends(obter_ator)):
        lim = servico.verificar_limite_orientandos(orientadorId)
        return LimiteOrientandosSaida(orientadorId=lim.orientador_id, limite=lim.limite,
                                      orientandosAtivos=lim.orientandos_ativos,
                                      vagasDisponiveis=lim.vagas_disponiveis, podeAceitar=lim.pode_aceitar)

    @app.get("/saude", tags=["Infra"], summary="Verificação de saúde")
    def saude():
        return {"status": "ok"}

    return app


app = criar_app()
