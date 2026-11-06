# OrientaTCC — Serviço de Propostas de Orientação

**Disciplina:** CC7532 – Tópicos Avançados de Engenharia de Software  
**Laboratório:** Lab 7 – Especificação e Implementação de Serviços  
**Grupo:** 11  
**Projeto de domínio:** OrientaTCC (plataforma de apoio à orientação de TCC)  
**Bounded Context:** Propostas (domínio Core)

---

## 1. O que é este projeto

Este repositório contém a **especificação e a implementação** de um serviço orientado a negócio do OrientaTCC, alinhado aos Bounded Contexts definidos no Lab 6 e à linguagem ubíqua do Lab 5.

O serviço escolhido é o **Serviço de Propostas de Orientação**. Ele materializa as capacidades de negócio do contexto **Propostas**:

| Capacidade de negócio | Operação do serviço |
|---|---|
| Submeter proposta de orientação | `submeterProposta` |
| Consultar uma proposta | `consultarProposta` |
| Listar propostas (do aluno ou do orientador) | `listarPropostas` |
| Verificar se o orientador ainda tem vaga | `verificarLimiteOrientandos` |
| Aceitar, devolver ou recusar uma proposta | `responderProposta` |

A operação **`responderProposta`** é a que tem o contrato detalhado no relatório do Lab 7 (pré-condições, pós-condições, regras de negócio, erros e consumidores).

Não há frontend. A API REST é a interface do serviço; a exploração e os testes usam Swagger UI, curl ou pytest.

---

## 2. Contexto de domínio (resumo)

### 2.1 Bounded Context selecionado

**Propostas** — domínio Core do OrientaTCC.

Responsabilidades:
- receber a proposta de orientação (tema, resumo, objetivos, área de pesquisa);
- manter o ciclo de vida da proposta até a resposta do orientador;
- criar o **Trabalho de TCC** (vínculo de orientação) quando a proposta é aceita;
- publicar eventos de domínio para os contextos consumidores.

### 2.2 Linguagem ubíqua usada no código

Termos que aparecem no domínio e na API (camelCase na Linguagem Publicada):

- **Proposta**, **tema**, **resumo**, **objetivos**, **área de pesquisa**
- **Aceite da proposta**, **devolução**, **recusa**, **justificativa**
- **Limite de orientandos**, **vagas disponíveis**
- **Aluno**, **Orientador**, **Ator** (usuário autenticado + perfil)
- **Trabalho de TCC**, **Vínculo de orientação**, **em orientação**
- Eventos: `PropostaAceita`, `PropostaDevolvida`, `PropostaRecusada`

### 2.3 Situações da Proposta

```
                  submeterProposta
                        │
                        ▼
              aguardando_orientador
                 │        │        │
         aceitar │  devolver│  recusar
                 ▼        ▼        ▼
              aceita   devolvida  recusada
                 │
                 └──► cria Trabalho de TCC (em_orientacao)
                      e publica PropostaAceita
```

---

## 3. O que foi feito neste Lab 7

1. **Seleção do Bounded Context** Propostas (Lab 6).
2. **Identificação das capacidades de negócio** e dos serviços candidatos.
3. **Especificação do contrato** da operação `responderProposta` (entrada, saída, pré/pós-condições, regras RN1–RN5, códigos de erro).
4. **Implementação** em FastAPI + Pydantic v2, com API REST sobre HTTP e JSON.
5. **Testes automatizados** (20 casos) cobrindo sucesso e condições de erro do contrato.
6. **Evidências** de execução (pytest, curl, capturas) e OpenAPI exportado.
7. **Relatório** (`Lab7_Servicos_OrientaTCC_Grupo11.pdf`) com a especificação textual.

---

## 4. Tecnologias

| Item | Escolha |
|---|---|
| Linguagem | Python 3.11+ (testado com 3.13) |
| Framework HTTP | FastAPI |
| Validação / DTOs | Pydantic v2 |
| Servidor ASGI | Uvicorn |
| Persistência | Memória (dados fictícios de demonstração) |
| Testes | pytest + `TestClient` (httpx) |
| Documentação da API | OpenAPI 3 gerado pelo FastAPI (`/docs`, `/openapi.json`) |

Dependências em `requirements.txt`:

```
fastapi==0.162.0
uvicorn==0.54.0
pydantic==2.14.2
pytest==9.2.0
httpx==0.28.1
```

---

## 5. Arquitetura da implementação

O código separa domínio, casos de uso, persistência e transporte HTTP:

```
app/
  dominio.py      entidades, enums, regras e erros de domínio
  servico.py      casos de uso (ServicoPropostas) — regras do contrato
  repositorio.py  repositório em memória + dados de demonstração
  eventos.py      barramento interno de eventos de domínio
  esquemas.py     DTOs da API (Linguagem Publicada, camelCase)
  main.py         rotas REST, ACL do Ator e tratamento de erros
tests/            testes automatizados (pytest)
docs/openapi.json especificação OpenAPI exportada
scripts/          exportação do OpenAPI e demonstração com curl
```

### 5.1 Camadas

| Camada | Papel |
|---|---|
| `main.py` | Traduz HTTP ↔ domínio: autenticação simulada (ACL), validação Pydantic, mapeamento de `ErroDominio` para JSON `{erro: {codigo, mensagem}}`. |
| `servico.py` | Orquestra os casos de uso. É aqui que vivem as pré-condições e as regras RN1–RN5 de `responderProposta`. |
| `dominio.py` | Modelo rico: `Proposta`, `TrabalhoTCC`, `Ator`, situações, decisões e hierarquia de erros. |
| `repositorio.py` | Persistência em memória + “transação” (`threading.RLock`) para o aceite ser atômico. Simula também as consultas a Cadastro Acadêmico (`IAluno` / `IOrientador`). |
| `eventos.py` | Barramento interno: publica o envelope da Linguagem Publicada **depois** da confirmação da transação. |
| `esquemas.py` | Contratos de entrada/saída da API (camelCase), alinhados à Linguagem Publicada. |

### 5.2 Autenticação simulada (ACL de Identidade e Acesso)

No OrientaTCC real, a sessão vem do Better Auth e a ACL traduz para o **Ator** `{usuarioId, perfil}`. Neste serviço isolado, o Ator é informado por cabeçalhos:

| Cabeçalho | Valores |
|---|---|
| `X-Usuario-Id` | `aluno-01` … `aluno-07`, `prof-01`, `prof-02` |
| `X-Perfil` | `aluno` ou `orientador` |

Ausência ou valor inválido → HTTP **401** (`NAO_AUTENTICADO` / `PERFIL_INVALIDO`).

> Observação alinhada ao feedback do Lab 5: **Identidade e acesso** é capacidade técnica de infraestrutura (ACL), não subdomínio de negócio. Por isso fica na borda HTTP, não no núcleo de Propostas.

### 5.3 Persistência e atomicidade

- Tudo fica em dicionários em memória (adequado para laboratório / demonstração).
- O aceite de proposta verifica limite, cria o Trabalho de TCC e atualiza a Proposta **na mesma transação** (`with self.repo.transacao`).
- O evento de domínio só é publicado **após** o commit (RN5), evitando notificar consumidores de um aceite que falhou.

---

## 6. Operações da API

Base URL local: `http://127.0.0.1:8000`  
Documentação interativa: `http://127.0.0.1:8000/docs`  
OpenAPI: `http://127.0.0.1:8000/openapi.json` (também em `docs/openapi.json`)

| Operação | Método e rota | Perfil |
|---|---|---|
| `submeterProposta` | `POST /propostas` | aluno |
| `listarPropostas` | `GET /propostas?situacao=` | aluno (próprias) / orientador (recebidas) |
| `consultarProposta` | `GET /propostas/{propostaId}` | aluno autor ou orientador destinatário |
| `responderProposta` | `POST /propostas/{propostaId}/resposta` | orientador destinatário |
| `verificarLimiteOrientandos` | `GET /orientadores/{orientadorId}/limite-orientandos` | autenticado |
| saúde | `GET /saude` | público |

### 6.1 Contrato detalhado de `responderProposta`

**Entrada**

```json
{
  "decisao": "aceitar" | "devolver" | "recusar",
  "justificativa": "texto opcional; obrigatório (≥ 10 caracteres) para devolver/recusar"
}
```

**Saída (sucesso, HTTP 200)**

```json
{
  "proposta": { "...campos da proposta atualizada..." },
  "trabalho": { "...somente quando decisao = aceitar..." } | null,
  "eventoPublicado": {
    "evento": "PropostaAceita" | "PropostaDevolvida" | "PropostaRecusada",
    "versao": 1,
    "ocorridoEm": "ISO-8601",
    "trabalhoId": "tcc-...." | null,
    "dados": {
      "propostaId": "...",
      "alunoId": "...",
      "orientadorId": "...",
      "decisao": "...",
      "justificativa": "..."
    }
  }
}
```

**Pré-condições (PC)**

1. Ator autenticado com perfil `orientador`.
2. A proposta existe.
3. O orientador autenticado é o destinatário da proposta.
4. A proposta está em `aguardando_orientador`.

**Regras de negócio (RN)**

1. **RN1** — no aceite, o aluno não pode já ter Trabalho de TCC em andamento.
2. **RN2** — no aceite, o orientador precisa ter vaga (`orientandosAtivos < limite`).
3. **RN3** — `devolver` e `recusar` exigem justificativa com pelo menos 10 caracteres.
4. **RN4** — aceite e criação do Trabalho de TCC ocorrem na mesma transação.
5. **RN5** — o evento de domínio só é publicado após a confirmação da transação.

**Erros**

| Situação | HTTP | Código |
|---|---|---|
| Sem cabeçalhos de autenticação | 401 | `NAO_AUTENTICADO` |
| Ator não é orientador | 403 | `PERFIL_NAO_PERMITIDO` |
| Orientador não é o destinatário | 403 | `ORIENTADOR_NAO_DESTINATARIO` |
| Proposta inexistente | 404 | `PROPOSTA_NAO_ENCONTRADA` |
| Proposta já respondida | 409 | `PROPOSTA_JA_RESPONDIDA` |
| Limite de orientandos atingido | 409 | `LIMITE_ORIENTANDOS_ATINGIDO` |
| Aluno já com trabalho em andamento | 409 | `TRABALHO_EM_ANDAMENTO` |
| Devolver/recusar sem justificativa válida | 422 | `JUSTIFICATIVA_OBRIGATORIA` |
| Corpo inválido (ex.: decisão desconhecida) | 422 | `DADOS_INVALIDOS` |

Formato único de erro:

```json
{
  "erro": {
    "codigo": "LIMITE_ORIENTANDOS_ATINGIDO",
    "mensagem": "Limite de orientandos atingido (2/2).",
    "detalhes": []
  }
}
```

(`detalhes` aparece principalmente em `DADOS_INVALIDOS`, com campo e problema.)

**Consumidores (forma de comunicação)**

- Aluno e Orientador consomem a operação de forma **síncrona** (HTTP).
- Contextos como Acompanhamento do TCC consomem o evento `PropostaAceita` de forma **assíncrona** (barramento interno / Linguagem Publicada).

---

## 7. Dados de demonstração (fictícios)

Carregados na inicialização por `carregar_dados_demonstracao`:

| ID | Papel | Observação |
|---|---|---|
| `prof-01` | Orientador | Limite 3, 1 orientando ativo → ainda tem vaga |
| `prof-02` | Orientador | Limite 2, 2 orientandos ativos → **lotado** |
| `aluno-01` … `aluno-07` | Alunos | Cadastro acadêmico simulado |
| `aluno-05` | Aluno | Já possui Trabalho de TCC em andamento |
| `prop-0001` | Proposta | `aluno-02` → `prof-01`, `aguardando_orientador` |
| `prop-0002` | Proposta | `aluno-03` → `prof-02`, `aguardando_orientador` |

Esses dados cobrem os cenários de sucesso (aceite em `prof-01`) e de erro (limite em `prof-02`, trabalho em andamento em `aluno-05`).

---

## 8. Como executar

```bash
# na pasta servico/
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://127.0.0.1:8000/docs
```

Verificação rápida:

```bash
curl http://127.0.0.1:8000/saude
# {"status":"ok"}
```

Exemplo — aceitar a proposta `prop-0001` como `prof-01`:

```bash
curl -s -X POST http://127.0.0.1:8000/propostas/prop-0001/resposta \
  -H 'Content-Type: application/json' \
  -H 'X-Usuario-Id: prof-01' \
  -H 'X-Perfil: orientador' \
  -d '{"decisao":"aceitar"}'
```

Exemplo — devolver com justificativa:

```bash
curl -s -X POST http://127.0.0.1:8000/propostas/prop-0001/resposta \
  -H 'Content-Type: application/json' \
  -H 'X-Usuario-Id: prof-01' \
  -H 'X-Perfil: orientador' \
  -d '{"decisao":"devolver","justificativa":"Delimitar melhor o escopo e os objetivos."}'
```

Há um script pronto que exercita vários cenários (incluindo erros):

```bash
./scripts/demo_curl.sh   # com o servidor em execução
```

---

## 9. Como testar

```bash
python -m pytest -v                # 20 testes automatizados
python scripts/exportar_openapi.py # regenera docs/openapi.json
```

### 9.1 Cobertura dos testes (resumo)

| ID | Cenário | Esperado |
|---|---|---|
| CT01 | Aceitar proposta | 200, cria Trabalho, publica `PropostaAceita` |
| CT02 | Devolver com justificativa | 200, `devolvida`, sem Trabalho |
| CT03 | Recusar sem justificativa | 422 `JUSTIFICATIVA_OBRIGATORIA` |
| CT04 | Aceite com orientador lotado | 409 `LIMITE_ORIENTANDOS_ATINGIDO` |
| CT05 | Proposta já respondida | 409 `PROPOSTA_JA_RESPONDIDA` |
| CT06 | Orientador não destinatário | 403 `ORIENTADOR_NAO_DESTINATARIO` |
| CT07 | Aluno tenta responder | 403 `PERFIL_NAO_PERMITIDO` |
| CT08 | Decisão inválida | 422 `DADOS_INVALIDOS` |
| CT09 | Proposta inexistente | 404 `PROPOSTA_NAO_ENCONTRADA` |
| CT10 | Sem autenticação | 401 `NAO_AUTENTICADO` |
| — | Justificativa curta demais | 422 `JUSTIFICATIVA_OBRIGATORIA` |
| CT11–CT13 + extras | Submissão, listagem, consulta, limite | sucesso e conflitos de regra |

Resultado da última execução registrada nas evidências: **20 passed**.

### 9.2 Evidências

Na pasta `../evidencias/` (fora do pacote `servico/`, junto do relatório):

- `01_testes_pytest.png` / `testes_pytest.log` — saída do pytest
- `02_curl_condicoes_de_erro.png` / `curl_demo.log` — erros via curl
- `03_curl_aceite_e_proposta_ja_respondida.png` — aceite e conflito 409
- `servidor_uvicorn.log` — log do servidor
- `git_log.txt` — histórico de commits da entrega

---

## 10. Decisões de projeto (por quê assim)

1. **Um serviço, um contrato detalhado** — atende ao pedido da professora (1 serviço + 1 contrato + FastAPI), sem diluir o Lab em vários microserviços.
2. **Domínio separado da API** — regras de negócio ficam em `servico.py` / `dominio.py`; HTTP só traduz. Facilita testar o contrato sem acoplar ao framework.
3. **Memória em vez de banco** — o Lab pede demonstrar o serviço e os erros do contrato, não a infraestrutura de persistência.
4. **Evento após commit** — evita notificar Acompanhamento do TCC de um aceite que foi revertido.
5. **ACL na borda** — Identidade e Acesso permanece capacidade técnica; o núcleo de Propostas só recebe o `Ator` já traduzido.
6. **Erros com código estável** — consumidores e testes afirmam `erro.codigo`, não a mensagem livre.

---

## 11. O que este repositório **não** inclui (de propósito)

- Frontend / UI gráfica
- Persistência em banco real
- Integração real com Better Auth (sessão simulada por cabeçalhos)
- Publicação em broker externo (o barramento é interno, suficiente para demonstrar a Linguagem Publicada)
- Os outros Bounded Contexts do OrientaTCC (só o mínimo do Núcleo Compartilhado: Trabalho de TCC)

---

## 12. Entrega do Lab 7

| Item | Onde |
|---|---|
| Relatório (29/10) | `Lab7_Servicos_OrientaTCC_Grupo11.pdf` / `.docx` |
| Código + este README | pasta `servico/` (este repositório) |
| Evidências de testes | pasta `evidencias/` |
| Link do repositório GitHub + evidências | pedido para 05/11 no enunciado |

Relatório já enviado no Moodle em 29/10/2026 21:53 (Grupo 11). A segunda parte da entrega é o link deste repositório e as evidências dos testes.

---

## 13. Licença / uso acadêmico

Material produzido para a disciplina CC7532 na FEI (Grupo 11). Uso acadêmico.
