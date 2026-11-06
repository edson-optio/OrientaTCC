"""DTOs da API (Linguagem Publicada, camelCase)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .dominio import JUSTIFICATIVA_MAX, Decisao, SituacaoProposta, SituacaoTrabalho


class Entrada(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SubmeterPropostaEntrada(Entrada):
    orientadorId: str = Field(min_length=1, examples=["prof-01"])
    tema: str = Field(min_length=5, max_length=200, examples=["Painel de andamento de TCC"])
    resumo: str = Field(min_length=20, max_length=3000)
    objetivos: str = Field(min_length=10, max_length=2000)
    areaPesquisa: str = Field(min_length=2, max_length=100, examples=["Engenharia de Software"])


class ResponderPropostaEntrada(Entrada):
    decisao: Decisao = Field(description="aceitar | devolver | recusar")
    justificativa: Optional[str] = Field(
        default=None, max_length=JUSTIFICATIVA_MAX,
        description="Obrigatória (mín. 10 caracteres) para devolver e recusar.")


class PropostaSaida(BaseModel):
    id: str
    alunoId: str
    orientadorId: str
    tema: str
    resumo: str
    objetivos: str
    areaPesquisa: str
    situacao: SituacaoProposta
    submetidaEm: datetime
    respondidaEm: Optional[datetime] = None
    decisao: Optional[Decisao] = None
    justificativa: Optional[str] = None
    trabalhoId: Optional[str] = None


class TrabalhoSaida(BaseModel):
    id: str
    propostaId: Optional[str]
    alunoId: str
    orientadorId: str
    situacao: SituacaoTrabalho
    iniciadoEm: datetime


class EventoSaida(BaseModel):
    evento: str
    versao: int
    ocorridoEm: datetime
    trabalhoId: Optional[str]
    dados: dict[str, Any]


class RespostaPropostaSaida(BaseModel):
    proposta: PropostaSaida
    trabalho: Optional[TrabalhoSaida]
    eventoPublicado: EventoSaida


class LimiteOrientandosSaida(BaseModel):
    orientadorId: str
    limite: int
    orientandosAtivos: int
    vagasDisponiveis: int
    podeAceitar: bool


class ErroDetalhe(BaseModel):
    codigo: str
    mensagem: str
    detalhes: Optional[List[dict[str, Any]]] = None


class ErroSaida(BaseModel):
    erro: ErroDetalhe
