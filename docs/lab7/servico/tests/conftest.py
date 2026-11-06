import pytest
from fastapi.testclient import TestClient

from app.main import criar_app


@pytest.fixture
def app():
    return criar_app()  # estado novo (dados de demonstração) a cada teste


@pytest.fixture
def cliente(app):
    return TestClient(app)


def ator(usuario, perfil):
    return {"X-Usuario-Id": usuario, "X-Perfil": perfil}


ALUNO_01 = ator("aluno-01", "aluno")
ALUNO_02 = ator("aluno-02", "aluno")
PROF_01 = ator("prof-01", "orientador")
PROF_02 = ator("prof-02", "orientador")

PROPOSTA_VALIDA = {
    "orientadorId": "prof-01",
    "tema": "Painel de andamento de TCC",
    "resumo": "Painel para o orientador acompanhar etapas, entregas e pendências dos orientandos.",
    "objetivos": "Levantar requisitos; implementar o painel; avaliar com orientadores.",
    "areaPesquisa": "Engenharia de Software",
}
