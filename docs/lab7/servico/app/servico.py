"""Serviço de aplicação: casos de uso do contexto Propostas."""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from .dominio import (JUSTIFICATIVA_MIN, AcessoNegado, Ator, Conflito, Decisao,
                      EventoDominio, NaoEncontrado, Perfil, Proposta, RegraViolada,
                      SituacaoProposta, TrabalhoTCC, agora)
from .eventos import BarramentoEventos
from .repositorio import RepositorioMemoria


@dataclass
class LimiteOrientandos:
    orientador_id: str
    limite: int
    orientandos_ativos: int

    @property
    def vagas_disponiveis(self) -> int:
        return max(self.limite - self.orientandos_ativos, 0)

    @property
    def pode_aceitar(self) -> bool:
        return self.orientandos_ativos < self.limite


@dataclass
class ResultadoResposta:
    proposta: Proposta
    trabalho: Optional[TrabalhoTCC]
    evento: EventoDominio


_EVENTO_POR_DECISAO = {
    Decisao.ACEITAR: ("PropostaAceita", SituacaoProposta.ACEITA),
    Decisao.DEVOLVER: ("PropostaDevolvida", SituacaoProposta.DEVOLVIDA),
    Decisao.RECUSAR: ("PropostaRecusada", SituacaoProposta.RECUSADA),
}


class ServicoPropostas:
    def __init__(self, repo: RepositorioMemoria, barramento: BarramentoEventos) -> None:
        self.repo = repo
        self.barramento = barramento

    # ------------------------------------------------------------ submeterProposta
    def submeter_proposta(self, ator: Ator, *, orientador_id: str, tema: str, resumo: str,
                          objetivos: str, area_pesquisa: str) -> Proposta:
        if ator.perfil != Perfil.ALUNO:
            raise AcessoNegado("Somente alunos podem submeter propostas.", "PERFIL_NAO_PERMITIDO")
        if not self.repo.consultar_aluno(ator.usuario_id):
            raise NaoEncontrado("Aluno não cadastrado no Cadastro Acadêmico.", "ALUNO_NAO_ENCONTRADO")
        if not self.repo.consultar_orientador(orientador_id):
            raise NaoEncontrado("Orientador não encontrado.", "ORIENTADOR_NAO_ENCONTRADO")
        with self.repo.transacao:
            if self.repo.trabalho_em_andamento_do_aluno(ator.usuario_id):
                raise Conflito("O aluno já possui Trabalho de TCC em andamento.",
                               "TRABALHO_EM_ANDAMENTO")
            ativa = self.repo.proposta_ativa_do_aluno(ator.usuario_id)
            if ativa:
                raise Conflito(f"O aluno já possui a proposta ativa {ativa.id} aguardando orientador.",
                               "PROPOSTA_ATIVA_EXISTENTE")
            proposta = Proposta(self.repo.novo_id_proposta(), ator.usuario_id, orientador_id,
                                tema.strip(), resumo.strip(), objetivos.strip(), area_pesquisa.strip())
            self.repo.salvar_proposta(proposta)
        return proposta

    # ------------------------------------------------------------ consultarProposta
    def consultar_proposta(self, ator: Ator, proposta_id: str) -> Proposta:
        proposta = self.repo.obter_proposta(proposta_id)
        if not proposta:
            raise NaoEncontrado(f"Proposta {proposta_id} não encontrada.", "PROPOSTA_NAO_ENCONTRADA")
        if ator.usuario_id not in (proposta.aluno_id, proposta.orientador_id):
            raise AcessoNegado("Somente o aluno autor e o orientador destinatário acessam a proposta.",
                               "SEM_ACESSO_A_PROPOSTA")
        return proposta

    # ------------------------------------------------------------ listarPropostas
    def listar_propostas(self, ator: Ator, situacao: SituacaoProposta | None) -> List[Proposta]:
        if ator.perfil == Perfil.ALUNO:
            return self.repo.listar_propostas(aluno_id=ator.usuario_id, situacao=situacao)
        return self.repo.listar_propostas(orientador_id=ator.usuario_id, situacao=situacao)

    # ------------------------------------------------------------ verificarLimiteOrientandos
    def verificar_limite_orientandos(self, orientador_id: str) -> LimiteOrientandos:
        orientador = self.repo.consultar_orientador(orientador_id)
        if not orientador:
            raise NaoEncontrado("Orientador não encontrado.", "ORIENTADOR_NAO_ENCONTRADO")
        return LimiteOrientandos(orientador.id, orientador.limite_orientandos,
                                 self.repo.contar_orientandos_ativos(orientador.id))

    # ------------------------------------------------------------ responderProposta
    def responder_proposta(self, ator: Ator, proposta_id: str, decisao: Decisao,
                           justificativa: Optional[str]) -> ResultadoResposta:
        # PC1 — ator autenticado com perfil orientador
        if ator.perfil != Perfil.ORIENTADOR:
            raise AcessoNegado("Somente orientadores podem responder propostas.", "PERFIL_NAO_PERMITIDO")
        justificativa = (justificativa or "").strip() or None

        with self.repo.transacao:  # a resposta inteira é atômica
            proposta = self.repo.obter_proposta(proposta_id)
            # PC2 — a proposta existe
            if not proposta:
                raise NaoEncontrado(f"Proposta {proposta_id} não encontrada.", "PROPOSTA_NAO_ENCONTRADA")
            # PC3 — o orientador é o destinatário
            if proposta.orientador_id != ator.usuario_id:
                raise AcessoNegado("A proposta foi submetida a outro orientador.",
                                   "ORIENTADOR_NAO_DESTINATARIO")
            # PC4 — a proposta está aguardando orientador
            if proposta.situacao != SituacaoProposta.AGUARDANDO_ORIENTADOR:
                raise Conflito(f"A proposta já foi respondida (situação: {proposta.situacao.value}).",
                               "PROPOSTA_JA_RESPONDIDA")
            # RN3 — devolução e recusa exigem justificativa
            if decisao in (Decisao.DEVOLVER, Decisao.RECUSAR):
                if not justificativa or len(justificativa) < JUSTIFICATIVA_MIN:
                    raise RegraViolada(
                        f"A decisão '{decisao.value}' exige justificativa com pelo menos "
                        f"{JUSTIFICATIVA_MIN} caracteres.", "JUSTIFICATIVA_OBRIGATORIA")

            trabalho = None
            if decisao == Decisao.ACEITAR:
                # RN1 — o aluno não pode ter trabalho em andamento
                if self.repo.trabalho_em_andamento_do_aluno(proposta.aluno_id):
                    raise Conflito("O aluno já possui Trabalho de TCC em andamento.",
                                   "TRABALHO_EM_ANDAMENTO")
                # RN2 — limite de orientandos verificado antes do aceite
                limite = self.verificar_limite_orientandos(ator.usuario_id)
                if not limite.pode_aceitar:
                    raise Conflito(
                        f"Limite de orientandos atingido ({limite.orientandos_ativos}/{limite.limite}).",
                        "LIMITE_ORIENTANDOS_ATINGIDO")
                # RN4 — aceite e criação do Trabalho de TCC na mesma transação
                trabalho = TrabalhoTCC(self.repo.novo_id_trabalho(), proposta.id,
                                       proposta.aluno_id, proposta.orientador_id)
                self.repo.salvar_trabalho(trabalho)
                proposta.trabalho_id = trabalho.id

            nome_evento, nova_situacao = _EVENTO_POR_DECISAO[decisao]
            proposta.situacao = nova_situacao
            proposta.decisao = decisao
            proposta.justificativa = justificativa
            proposta.respondida_em = agora()
            self.repo.salvar_proposta(proposta)

            evento = EventoDominio(
                evento=nome_evento,
                trabalho_id=trabalho.id if trabalho else None,
                dados={"propostaId": proposta.id, "alunoId": proposta.aluno_id,
                       "orientadorId": proposta.orientador_id, "decisao": decisao.value,
                       "justificativa": justificativa},
            )
        # RN5 — evento publicado somente após a confirmação da transação
        self.barramento.publicar(evento)
        return ResultadoResposta(proposta, trabalho, evento)
