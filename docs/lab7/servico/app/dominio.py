"""Modelo de domínio do Bounded Context Propostas.

Termos da linguagem ubíqua (Lab 5/Lab 6): Proposta, tema, resumo, objetivos,
área de pesquisa, Aceite da proposta, Limite de orientandos, Aluno, Orientador,
Trabalho de TCC e Vínculo de orientação.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


def agora() -> datetime:
    return datetime.now(timezone.utc)


class Perfil(str, Enum):
    ALUNO = "aluno"
    ORIENTADOR = "orientador"


class SituacaoProposta(str, Enum):
    AGUARDANDO_ORIENTADOR = "aguardando_orientador"
    DEVOLVIDA = "devolvida"
    RECUSADA = "recusada"
    ACEITA = "aceita"


class Decisao(str, Enum):
    ACEITAR = "aceitar"
    DEVOLVER = "devolver"
    RECUSAR = "recusar"


# Regra de negócio: devolução e recusa exigem justificativa com conteúdo mínimo.
JUSTIFICATIVA_MIN = 10
JUSTIFICATIVA_MAX = 2000


@dataclass(frozen=True)
class Ator:
    """Ator autenticado, traduzido pela ACL de Identidade e Acesso."""
    usuario_id: str
    perfil: Perfil


@dataclass
class Aluno:
    id: str
    nome: str
    curso: str


@dataclass
class Orientador:
    id: str
    nome: str
    area_pesquisa: str
    limite_orientandos: int


@dataclass
class Proposta:
    id: str
    aluno_id: str
    orientador_id: str
    tema: str
    resumo: str
    objetivos: str
    area_pesquisa: str
    situacao: SituacaoProposta = SituacaoProposta.AGUARDANDO_ORIENTADOR
    submetida_em: datetime = field(default_factory=agora)
    respondida_em: Optional[datetime] = None
    decisao: Optional[Decisao] = None
    justificativa: Optional[str] = None
    trabalho_id: Optional[str] = None


class SituacaoTrabalho(str, Enum):
    EM_ORIENTACAO = "em_orientacao"
    CONCLUIDO = "concluido"


@dataclass
class TrabalhoTCC:
    """Modelo mínimo do Núcleo Compartilhado (Vínculo de orientação)."""
    id: str
    proposta_id: Optional[str]
    aluno_id: str
    orientador_id: str
    situacao: SituacaoTrabalho = SituacaoTrabalho.EM_ORIENTACAO
    iniciado_em: datetime = field(default_factory=agora)


@dataclass
class EventoDominio:
    """Envelope da Linguagem Publicada (evento, versao, ocorridoEm, trabalhoId, dados)."""
    evento: str
    dados: dict
    trabalho_id: Optional[str] = None
    versao: int = 1
    ocorrido_em: datetime = field(default_factory=agora)


# ---------------------------------------------------------------- erros
class ErroDominio(Exception):
    status = 400
    codigo = "ERRO"

    def __init__(self, mensagem: str, codigo: str | None = None):
        super().__init__(mensagem)
        self.mensagem = mensagem
        if codigo:
            self.codigo = codigo


class NaoAutenticado(ErroDominio):
    status, codigo = 401, "NAO_AUTENTICADO"


class AcessoNegado(ErroDominio):
    status, codigo = 403, "ACESSO_NEGADO"


class NaoEncontrado(ErroDominio):
    status, codigo = 404, "NAO_ENCONTRADO"


class Conflito(ErroDominio):
    status, codigo = 409, "CONFLITO"


class RegraViolada(ErroDominio):
    status, codigo = 422, "REGRA_DE_NEGOCIO_VIOLADA"
