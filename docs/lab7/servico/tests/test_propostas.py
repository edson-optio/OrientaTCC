"""Testes automatizados do Serviço de Propostas (contrato de responderProposta e demais operações)."""
from tests.conftest import ALUNO_01, ALUNO_02, PROF_01, PROF_02, PROPOSTA_VALIDA, ator


# ------------------------------------------------------------------ responderProposta
def test_ct01_aceitar_proposta_cria_trabalho_e_publica_evento(cliente, app):
    r = cliente.post("/propostas/prop-0001/resposta", json={"decisao": "aceitar"}, headers=PROF_01)
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["proposta"]["situacao"] == "aceita"
    assert corpo["trabalho"]["situacao"] == "em_orientacao"
    assert corpo["trabalho"]["alunoId"] == "aluno-02"
    assert corpo["proposta"]["trabalhoId"] == corpo["trabalho"]["id"]
    assert corpo["eventoPublicado"]["evento"] == "PropostaAceita"
    assert [e.evento for e in app.state.barramento.publicados] == ["PropostaAceita"]
    lim = cliente.get("/orientadores/prof-01/limite-orientandos", headers=PROF_01).json()
    assert lim["orientandosAtivos"] == 2 and lim["vagasDisponiveis"] == 1


def test_ct02_devolver_com_justificativa(cliente):
    r = cliente.post("/propostas/prop-0001/resposta", headers=PROF_01,
                     json={"decisao": "devolver", "justificativa": "Delimitar melhor o escopo e os objetivos."})
    assert r.status_code == 200
    assert r.json()["proposta"]["situacao"] == "devolvida"
    assert r.json()["trabalho"] is None
    assert r.json()["eventoPublicado"]["evento"] == "PropostaDevolvida"


def test_ct03_recusar_sem_justificativa_viola_regra(cliente, app):
    r = cliente.post("/propostas/prop-0001/resposta", json={"decisao": "recusar"}, headers=PROF_01)
    assert r.status_code == 422
    assert r.json()["erro"]["codigo"] == "JUSTIFICATIVA_OBRIGATORIA"
    assert app.state.repo.obter_proposta("prop-0001").situacao.value == "aguardando_orientador"
    assert app.state.barramento.publicados == []


def test_ct04_aceite_bloqueado_por_limite_de_orientandos(cliente, app):
    r = cliente.post("/propostas/prop-0002/resposta", json={"decisao": "aceitar"}, headers=PROF_02)
    assert r.status_code == 409
    assert r.json()["erro"]["codigo"] == "LIMITE_ORIENTANDOS_ATINGIDO"
    assert app.state.repo.obter_proposta("prop-0002").situacao.value == "aguardando_orientador"
    assert app.state.repo.contar_orientandos_ativos("prof-02") == 2
    assert app.state.barramento.publicados == []


def test_ct05_proposta_ja_respondida(cliente):
    cliente.post("/propostas/prop-0001/resposta", json={"decisao": "aceitar"}, headers=PROF_01)
    r = cliente.post("/propostas/prop-0001/resposta", headers=PROF_01,
                     json={"decisao": "recusar", "justificativa": "Tentativa de nova resposta."})
    assert r.status_code == 409
    assert r.json()["erro"]["codigo"] == "PROPOSTA_JA_RESPONDIDA"


def test_ct06_orientador_nao_destinatario(cliente):
    r = cliente.post("/propostas/prop-0001/resposta", json={"decisao": "aceitar"}, headers=PROF_02)
    assert r.status_code == 403
    assert r.json()["erro"]["codigo"] == "ORIENTADOR_NAO_DESTINATARIO"


def test_ct07_aluno_nao_pode_responder(cliente):
    r = cliente.post("/propostas/prop-0001/resposta", json={"decisao": "aceitar"}, headers=ALUNO_02)
    assert r.status_code == 403
    assert r.json()["erro"]["codigo"] == "PERFIL_NAO_PERMITIDO"


def test_ct08_decisao_invalida(cliente):
    r = cliente.post("/propostas/prop-0001/resposta", json={"decisao": "talvez"}, headers=PROF_01)
    assert r.status_code == 422
    corpo = r.json()["erro"]
    assert corpo["codigo"] == "DADOS_INVALIDOS"
    assert corpo["detalhes"][0]["campo"] == "decisao"


def test_ct09_proposta_inexistente(cliente):
    r = cliente.post("/propostas/prop-9999/resposta", json={"decisao": "aceitar"}, headers=PROF_01)
    assert r.status_code == 404
    assert r.json()["erro"]["codigo"] == "PROPOSTA_NAO_ENCONTRADA"


def test_ct10_sem_autenticacao(cliente):
    r = cliente.post("/propostas/prop-0001/resposta", json={"decisao": "aceitar"})
    assert r.status_code == 401
    assert r.json()["erro"]["codigo"] == "NAO_AUTENTICADO"


def test_justificativa_curta_e_rejeitada(cliente):
    r = cliente.post("/propostas/prop-0001/resposta", headers=PROF_01,
                     json={"decisao": "devolver", "justificativa": "   ajuste  "})
    assert r.status_code == 422
    assert r.json()["erro"]["codigo"] == "JUSTIFICATIVA_OBRIGATORIA"


# ------------------------------------------------------------------ submeterProposta
def test_ct11_submeter_proposta_valida(cliente):
    r = cliente.post("/propostas", json=PROPOSTA_VALIDA, headers=ALUNO_01)
    assert r.status_code == 201
    assert r.json()["situacao"] == "aguardando_orientador"
    assert r.json()["alunoId"] == "aluno-01"


def test_ct12_aluno_com_proposta_ativa_nao_submete_outra(cliente):
    r = cliente.post("/propostas", json=PROPOSTA_VALIDA, headers=ALUNO_02)
    assert r.status_code == 409
    assert r.json()["erro"]["codigo"] == "PROPOSTA_ATIVA_EXISTENTE"


def test_aluno_com_trabalho_em_andamento_nao_submete(cliente):
    r = cliente.post("/propostas", json=PROPOSTA_VALIDA, headers=ator("aluno-05", "aluno"))
    assert r.status_code == 409
    assert r.json()["erro"]["codigo"] == "TRABALHO_EM_ANDAMENTO"


def test_aluno_pode_submeter_nova_proposta_apos_devolucao(cliente):
    cliente.post("/propostas/prop-0001/resposta", headers=PROF_01,
                 json={"decisao": "devolver", "justificativa": "Delimitar melhor o escopo."})
    r = cliente.post("/propostas", json=PROPOSTA_VALIDA, headers=ALUNO_02)
    assert r.status_code == 201


def test_ct13_submeter_com_campos_invalidos(cliente):
    r = cliente.post("/propostas", json={**PROPOSTA_VALIDA, "tema": "TCC", "resumo": ""}, headers=ALUNO_01)
    assert r.status_code == 422
    campos = {d["campo"] for d in r.json()["erro"]["detalhes"]}
    assert {"tema", "resumo"} <= campos


def test_submeter_para_orientador_inexistente(cliente):
    r = cliente.post("/propostas", json={**PROPOSTA_VALIDA, "orientadorId": "prof-99"}, headers=ALUNO_01)
    assert r.status_code == 404
    assert r.json()["erro"]["codigo"] == "ORIENTADOR_NAO_ENCONTRADO"


# ------------------------------------------------------------------ consultar / listar / limite
def test_consultar_proposta_por_participante_e_terceiro(cliente):
    assert cliente.get("/propostas/prop-0001", headers=ALUNO_02).status_code == 200
    assert cliente.get("/propostas/prop-0001", headers=PROF_01).status_code == 200
    r = cliente.get("/propostas/prop-0001", headers=ALUNO_01)
    assert r.status_code == 403
    assert r.json()["erro"]["codigo"] == "SEM_ACESSO_A_PROPOSTA"


def test_listar_propostas_por_perfil_e_situacao(cliente):
    recebidas = cliente.get("/propostas", params={"situacao": "aguardando_orientador"}, headers=PROF_01).json()
    assert [p["id"] for p in recebidas] == ["prop-0001"]
    assert [p["id"] for p in cliente.get("/propostas", headers=ALUNO_02).json()] == ["prop-0001"]
    assert cliente.get("/propostas", headers=ALUNO_01).json() == []


def test_verificar_limite_orientandos(cliente):
    r = cliente.get("/orientadores/prof-02/limite-orientandos", headers=PROF_02)
    assert r.json() == {"orientadorId": "prof-02", "limite": 2, "orientandosAtivos": 2,
                        "vagasDisponiveis": 0, "podeAceitar": False}
    assert cliente.get("/orientadores/prof-99/limite-orientandos", headers=PROF_02).status_code == 404
