# @orientatcc/api

API do OrientaTCC construída com [Elysia](https://elysiajs.com) rodando em Bun.

## Como rodar

Na raiz do monorepo:

```bash
bun install
bun run dev:api
```

A API sobe em `http://localhost:3000` (configurável pela variável `PORT`; veja `.env.example`).

Outros scripts (dentro de `apps/api`): `bun run start`, `bun run build`, `bun run typecheck`, `bun run test`.

## Rotas

- `GET /health`: verifica se o serviço está no ar. Retorna `{ "status": "ok", "service": "orientatcc-api", "timestamp": "<ISO 8601>" }`.
- `GET /notificacoes`, `POST /notificacoes/teste`, `PATCH /notificacoes/:id/lida`, `POST /notificacoes/reenviar`: veja [Notificações](#notificações).
- `POST /monitor-prazos/executar`, `GET /monitor-prazos/status`: veja [Monitor de Prazos](#monitor-de-prazos).

## Documentação

A documentação OpenAPI/OpenAPI fica em `http://localhost:3000/docs`.

## Estrutura

Os componentes de domínio ficam em `src/modules/` (veja o `README.md` dessa pasta).

## Banco de dados

Persistência com [Drizzle ORM](https://orm.drizzle.team) sobre SQLite (`bun:sqlite`).

- Arquivo do banco: `apps/api/data/orientatcc.db` (ignorado pelo git; configurável pela variável `DATABASE_URL`, relativa a `apps/api`).
- Schema: `src/db/schema/`, um arquivo por componente da modelagem (`cadastros`, `proposta`, `trabalho`, `orientacao`, `cronograma`, `entregas`, `notificacao`), exportados por `src/db/schema/index.ts`.
- Cliente: `src/db/index.ts` exporta `db` (instância do Drizzle) e `schema`.
- Migrações: pasta `drizzle/` (versionada), geradas pelo `drizzle-kit` a partir de `drizzle.config.ts`.

Comandos (dentro de `apps/api`):

```bash
bun run db:generate   # gera uma nova migração em drizzle/ a partir do schema
bun run db:migrate    # aplica as migrações pendentes no banco (cria o arquivo se não existir)
bun run db:seed       # popula dados de exemplo (idempotente; pode rodar várias vezes)
bun run db:studio     # abre o Drizzle Studio para inspecionar os dados
```

Para começar do zero: `bun run db:migrate && bun run db:seed`.

O seed cria os parâmetros (limite de 5 orientandos, domínio `exemplo.edu.br`), um curso, um semestre, os usuários `admin@exemplo.edu.br`, `ana.souza@exemplo.edu.br` (professor) e `carlos.lima@exemplo.edu.br` (aluno), uma proposta aceita com o trabalho em orientação, um cronograma publicado com três etapas (duas parciais e uma final) e uma entrega com uma versão e um feedback "revisar". Senhas ainda não existem: ficam a cargo do Better Auth.

Fluxo ao alterar o schema: edite os arquivos em `src/db/schema/`, rode `bun run db:generate` e depois `bun run db:migrate`.

As tabelas de conta/sessão do Better Auth ainda não fazem parte do schema; serão adicionadas junto com o componente de autenticação.

## Notificações

O componente Notificação (`src/modules/notificacao/`) cria as notificações internas
do aplicativo, persiste-as na tabela `notificacoes` (Drizzle) e delega a entrega do
e-mail ao serviço externo [Resend](https://resend.com) por meio da interface requerida `IEmail`.

Arquivos:

- `interface.ts`: `INotificacao` (`notificar`, `listarPendentes`, `marcarNotificacaoLida`,
  `reagendarEnvio`) com os contratos, `IEmail` (`enviarEmail`), os tipos de notificação,
  os dados exigidos por cada um e os erros `ErroPreCondicao`, `ErroNaoEncontrado` e `ErroAcessoNegado`.
- `templates.ts`: um template em português por tipo, gerando assunto e HTML.
- `email/resend.ts`: `ResendEmail`, implementação de `IEmail` com o pacote `resend`.
- `email/console.ts`: `ConsoleEmail`, que só registra no console (desenvolvimento).
- `email/index.ts`: `criarEmail()` escolhe `ResendEmail` se houver `RESEND_API_KEY`, senão `ConsoleEmail`.
- `repositorio.ts`: `INotificacaoRepositorio` com `RepositorioDrizzle` (tabela `notificacoes`)
  e `RepositorioMemoria` (testes).
- `service.ts`: `NotificacaoService`, que recebe `IEmail` e `INotificacaoRepositorio` por injeção.
- `routes.ts`: plugin Elysia com as rotas abaixo; `criarRotasNotificacao(servico, resolverDestinatario)`
  permite injetar outras implementações.
- `service.test.ts` e `repositorio.test.ts`: testes com `IEmail` falso, `RepositorioMemoria` e
  `RepositorioDrizzle` sobre SQLite em memória (`banco-teste.ts` cria o schema a partir de `src/db/schema`).

Tipos de notificação: `prazo_proximo`, `entrega_atrasada`, `feedback_disponivel`,
`proposta_status`, `convite_orientacao`, `convite_banca`.

Rotas:

| Método e caminho                    | Descrição                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /notificacoes?destinatarioId=` | Lista as pendentes (não lidas), da mais recente para a mais antiga.                             |
| `POST /notificacoes/teste`          | Body `{ email, tipo }`; dispara uma notificação de exemplo.                                     |
| `PATCH /notificacoes/:id/lida`      | Body `{ usuarioId }`; marca como lida (UC06). `404` se não existe, `403` se é de outro usuário. |
| `POST /notificacoes/reenviar`       | Reenvia os e-mails com envio falho, até 3 tentativas no total (UC07 A1).                        |

A rota de teste procura o usuário pelo e-mail em `usuarios`; se não existir, cria um
usuário de teste (perfil aluno) para satisfazer a chave estrangeira. O `usuarioId` do
`PATCH` vem do body até a autenticação (Better Auth) fornecer a sessão.

Mapeamento na tabela `notificacoes`: `titulo` guarda o assunto, `mensagem` o HTML,
`dados` (JSON) guarda `{ conteudo, destinatarioEmail, emailId, erroEnvio }`, `enviada_em`
nulo indica envio falho e `tentativas_envio` conta as tentativas.

Variáveis de ambiente (veja `.env.example`):

| Variável         | Descrição                                                                   |
| ---------------- | --------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Chave da API do Resend. Se vazia, os e-mails são apenas logados no console. |
| `RESEND_FROM`    | Remetente. Padrão: `OrientaTCC <onboarding@resend.dev>`.                    |

Exemplo de teste manual (com o banco migrado, `bun run db:migrate`):

```bash
curl -X POST http://localhost:3000/notificacoes/teste \
  -H "Content-Type: application/json" \
  -d '{"email":"voce@exemplo.com","tipo":"prazo_proximo"}'

curl http://localhost:3000/notificacoes

curl -X PATCH http://localhost:3000/notificacoes/1/lida \
  -H "Content-Type: application/json" -d '{"usuarioId":1}'

curl -X POST http://localhost:3000/notificacoes/reenviar
```

Se o serviço de e-mail falhar, a notificação interna é mantida com `envio: "falhou"`
e o erro registrado (UC07 A1); `POST /notificacoes/reenviar` tenta de novo. Uma
pré-condição violada (por exemplo, e-mail vazio) responde `400` com
`{ "erro": "pre_condicao", "mensagem": "..." }`.

## Monitor de Prazos

O componente Monitor de Prazos (`src/modules/monitor-prazos/`) implementa o UC07: o
ator Tempo (agendador) dispara diariamente a verificação de prazos próximos, entregas
atrasadas e feedbacks não lidos, acionando o componente Notificação.

Arquivos:

- `interface.ts`: `IMonitorPrazos` (`verificarPrazos(agora)` devolvendo `ResumoVerificacao`)
  com o contrato, e as interfaces requeridas `ICronograma`, `IEntrega`, `IFeedback`,
  `INotificacao` e `IHistoricoNotificacao` (consulta para não duplicar).
- `consultas.ts`: leitores mínimos sobre o Drizzle que cumprem as interfaces requeridas.
  São provisórios: serão trocados pelos componentes Cronograma e Entregas quando existirem.
- `datas.ts`: dias-calendário no fuso `America/Sao_Paulo`.
- `service.ts`: `MonitorPrazosService`, com as cinco dependências injetadas.
- `agendador.ts`: cron diário às 07:00 (`America/Sao_Paulo`) com `@elysiajs/cron` e o
  `ExecutorMonitor`, que guarda a última execução.
- `routes.ts`: plugin Elysia; `criarRotasMonitorPrazos(executor, agendador?)` permite injeção.
- `service.test.ts`: cenários de 7 dias, 2 dias, atraso, feedback não lido e idempotência,
  sobre SQLite em memória com seed próprio.

Regras:

| Situação                                                         | Ação                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Etapa sem entrega com prazo em exatamente 7 ou 2 dias            | Notificação `prazo_proximo` ao aluno.                                       |
| Etapa sem entrega com prazo vencido                              | Entrega marcada `atrasada` (criada se não existir); `entrega_atrasada` ao aluno e ao orientador. |
| Feedback com `lido_em` nulo registrado há mais de 2 dias         | Notificação `feedback_disponivel` ao aluno.                                 |

"Sem entrega" significa não haver entrega ou ela estar `pendente` ou `atrasada`. Só
entram cronogramas publicados de trabalhos `em_orientacao`. Antes de notificar, o monitor
consulta a tabela `notificacoes` (tipo, destinatário e etapa/trabalho no JSON `dados`) e não
gera outra notificação igual no mesmo dia, então repetir a execução no mesmo dia é inócuo.

Rotas:

| Método e caminho                | Descrição                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| `POST /monitor-prazos/executar` | Executa a verificação agora e devolve o `ResumoVerificacao`.     |
| `GET /monitor-prazos/status`    | Agendamento (ativo, padrão, fuso, próxima execução) e última execução. |

Variável de ambiente: `MONITOR_PRAZOS_CRON=off` desliga o agendador (a rota manual continua
funcionando).

Exemplo:

```bash
curl -X POST http://localhost:3000/monitor-prazos/executar
curl http://localhost:3000/monitor-prazos/status
```

## Autenticação

O Componente Autenticação (`src/modules/autenticacao/`) reutiliza o [Better Auth](https://www.better-auth.com) com e-mail e senha, verificação de e-mail obrigatória e sessões por cookie ou `Authorization: Bearer <token>` (plugin `bearer`, pensado para o app mobile).

- `config.ts`: `criarAuth({ db, email })` monta o Better Auth sobre o Drizzle (`drizzleAdapter`, provider sqlite) com os campos adicionais `perfil` (aluno|professor|admin), `cursoId` e `usuarioId`. Os hooks de criação do usuário validam o domínio institucional (`parametros.dominio_email`) e criam a linha correspondente em `usuarios`, que continua sendo a fonte do domínio; a ligação fica em `user.usuario_id`.
- `auth.ts`: instância real (banco de `src/db/index.ts` + IEmail do Componente Notificação, que envia o e-mail de confirmação).
- `auth.cli.ts`: configuração usada só pelo CLI para regerar `src/db/schema/auth.ts` (`bunx @better-auth/cli generate --config src/modules/autenticacao/auth.cli.ts --output src/db/schema/auth.ts`).
- `interface.ts` (IAutenticacao: cadastrar, autenticar, obterSessao, encerrarSessao, verificarPermissao), `service.ts` (fachada sobre o Better Auth e o guard `exigirPerfil`), `routes.ts`.

Rotas:

- `POST /api/auth/sign-up/email` com `{ name, email, password, perfil, cursoId? }`: cadastro (UC10). Só `aluno` e `professor` podem se autocadastrar; o e-mail precisa ser do domínio institucional. Um e-mail de confirmação é enviado (no console, sem `RESEND_API_KEY`).
- `GET /api/auth/verify-email?token=...`: confirma o e-mail (link do e-mail).
- `POST /api/auth/sign-in/email` com `{ email, password }`: login (UC11). Devolve o cookie de sessão e o `token`; e-mail não confirmado retorna 403.
- `GET /auth/eu`: sessão atual com `usuario` (id, usuarioId, nome, email, perfil, cursoId) ou 401.
- `POST /api/auth/sign-out`: encerra a sessão. Demais endpoints do Better Auth (get-session, forget-password, etc.) também ficam sob `/api/auth/*`.

Proteger rotas por perfil:

```ts
import { exigirPerfilPadrao } from "./modules/autenticacao/routes";

app.use(exigirPerfilPadrao(["professor"])).get("/painel", ({ usuario }) => usuario.nome);
```

Variáveis: `BETTER_AUTH_SECRET` (obrigatória em produção) e `BETTER_AUTH_URL` (URL pública usada nos links de confirmação). Contas do seed: `admin@`, `ana.souza@` (professor) e `carlos.lima@` (aluno) em `exemplo.edu.br`, todas com senha `senha123` e e-mail já confirmado.

Exemplo de login e consulta da sessão:

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana.souza@exemplo.edu.br","password":"senha123"}'
curl -b cookies.txt http://localhost:3000/auth/eu
```
