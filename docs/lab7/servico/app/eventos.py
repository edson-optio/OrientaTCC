"""Barramento interno de eventos de domínio (publicação após a confirmação)."""
from __future__ import annotations

from typing import Callable, List

from .dominio import EventoDominio


class BarramentoEventos:
    def __init__(self) -> None:
        self.publicados: List[EventoDominio] = []
        self._assinantes: List[Callable[[EventoDominio], None]] = []

    def assinar(self, assinante: Callable[[EventoDominio], None]) -> None:
        self._assinantes.append(assinante)

    def publicar(self, evento: EventoDominio) -> None:
        self.publicados.append(evento)
        for assinante in self._assinantes:
            assinante(evento)
