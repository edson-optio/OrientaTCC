"""Repositório em memória do contexto Propostas.

Guarda propostas e o modelo mínimo do Vínculo de orientação (Trabalho de TCC,
Núcleo Compartilhado com Acompanhamento do TCC). Alunos e orientadores
representam as respostas de IAluno/IOrientador (Cadastro Acadêmico), aqui
simuladas por dados de demonstração fictícios.
"""
from __future__ import annotations

import itertools
import threading
from typing import Dict, List, Optional

from .dominio import (Aluno, Orientador, Proposta, SituacaoProposta,
                      SituacaoTrabalho, TrabalhoTCC)


class RepositorioMemoria:
    def __init__(self) -> None:
        self.alunos: Dict[str, Aluno] = {}
        self.orientadores: Dict[str, Orientador] = {}
        self.propostas: Dict[str, Proposta] = {}
        self.trabalhos: Dict[str, TrabalhoTCC] = {}
        # Uma "transação": o aceite verifica o limite e cria o trabalho de forma atômica.
        self.transacao = threading.RLock()
        self._seq_proposta = itertools.count(1)
        self._seq_trabalho = itertools.count(1)

    # ---- identificadores
    def novo_id_proposta(self) -> str:
        while True:
            pid = f"prop-{next(self._seq_proposta):04d}"
            if pid not in self.propostas:
                return pid

    def novo_id_trabalho(self) -> str:
        while True:
            tid = f"tcc-{next(self._seq_trabalho):04d}"
            if tid not in self.trabalhos:
                return tid

    # ---- IAluno / IOrientador (Cadastro Acadêmico)
    def consultar_aluno(self, aluno_id: str) -> Optional[Aluno]:
        return self.alunos.get(aluno_id)

    def consultar_orientador(self, orientador_id: str) -> Optional[Orientador]:
        return self.orientadores.get(orientador_id)

    # ---- Propostas
    def salvar_proposta(self, proposta: Proposta) -> None:
        self.propostas[proposta.id] = proposta

    def obter_proposta(self, proposta_id: str) -> Optional[Proposta]:
        return self.propostas.get(proposta_id)

    def listar_propostas(self, *, aluno_id: str | None = None,
                         orientador_id: str | None = None,
                         situacao: SituacaoProposta | None = None) -> List[Proposta]:
        res = list(self.propostas.values())
        if aluno_id:
            res = [p for p in res if p.aluno_id == aluno_id]
        if orientador_id:
            res = [p for p in res if p.orientador_id == orientador_id]
        if situacao:
            res = [p for p in res if p.situacao == situacao]
        return sorted(res, key=lambda p: p.submetida_em)

    def proposta_ativa_do_aluno(self, aluno_id: str) -> Optional[Proposta]:
        for p in self.propostas.values():
            if p.aluno_id == aluno_id and p.situacao == SituacaoProposta.AGUARDANDO_ORIENTADOR:
                return p
        return None

    # ---- Vínculo de orientação (Núcleo Compartilhado)
    def salvar_trabalho(self, trabalho: TrabalhoTCC) -> None:
        self.trabalhos[trabalho.id] = trabalho

    def trabalho_em_andamento_do_aluno(self, aluno_id: str) -> Optional[TrabalhoTCC]:
        for t in self.trabalhos.values():
            if t.aluno_id == aluno_id and t.situacao == SituacaoTrabalho.EM_ORIENTACAO:
                return t
        return None

    def contar_orientandos_ativos(self, orientador_id: str) -> int:
        return sum(1 for t in self.trabalhos.values()
                   if t.orientador_id == orientador_id
                   and t.situacao == SituacaoTrabalho.EM_ORIENTACAO)


def carregar_dados_demonstracao(repo: RepositorioMemoria) -> RepositorioMemoria:
    """Dados fictícios usados na demonstração e nos testes."""
    for a in [
        Aluno("aluno-01", "Ana Beatriz Lima", "Ciência da Computação"),
        Aluno("aluno-02", "Bruno Carvalho", "Ciência da Computação"),
        Aluno("aluno-03", "Carla Mendes", "Ciência da Computação"),
        Aluno("aluno-04", "Diego Nunes", "Ciência da Computação"),
        Aluno("aluno-05", "Eduarda Rocha", "Ciência da Computação"),
        Aluno("aluno-06", "Felipe Santos", "Ciência da Computação"),
        Aluno("aluno-07", "Gabriela Torres", "Ciência da Computação"),
    ]:
        repo.alunos[a.id] = a
    for o in [
        Orientador("prof-01", "Profa. Dra. Helena Prado", "Engenharia de Software", 3),
        Orientador("prof-02", "Prof. Dr. Igor Martins", "Inteligência Artificial", 2),
    ]:
        repo.orientadores[o.id] = o
    # Vínculos ativos: prof-01 com 1 de 3 orientandos; prof-02 lotado (2 de 2).
    for aluno_id, orientador_id in [("aluno-05", "prof-01"),
                                    ("aluno-06", "prof-02"),
                                    ("aluno-07", "prof-02")]:
        repo.salvar_trabalho(TrabalhoTCC(repo.novo_id_trabalho(), None, aluno_id, orientador_id))
    # Propostas aguardando resposta.
    repo.salvar_proposta(Proposta(
        repo.novo_id_proposta(), "aluno-02", "prof-01",
        "Recomendação de orientadores por área de pesquisa",
        "Estudo de técnicas para sugerir orientadores a partir da área de pesquisa e do histórico de TCCs.",
        "Levantar critérios de recomendação; implementar protótipo; avaliar com alunos.",
        "Engenharia de Software"))
    repo.salvar_proposta(Proposta(
        repo.novo_id_proposta(), "aluno-03", "prof-02",
        "Classificação automática de resumos de TCC",
        "Aplicação de modelos de linguagem para classificar resumos de TCC por área de pesquisa.",
        "Montar base de resumos; treinar classificador; comparar com classificação manual.",
        "Inteligência Artificial"))
    return repo
