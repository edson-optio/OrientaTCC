# @orientatcc/mobile

Aplicativo mobile do OrientaTCC, feito com [Expo](https://expo.dev) (SDK 57), [expo-router](https://docs.expo.dev/router/introduction/) e React Native em TypeScript.

## Como rodar

1. Na raiz do monorepo, instale as dependências:

   ```bash
   bun install
   ```

2. Copie o arquivo de variáveis de ambiente e ajuste a URL da API se necessário:

   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   ```

3. Inicie o app (a partir da raiz ou da pasta do app):

   ```bash
   bun run dev:mobile
   # ou
   cd apps/mobile && bunx expo start
   ```

4. Abra no dispositivo com o app Expo Go (escaneando o QR code) ou pressione `a` para Android / `i` para iOS no terminal.

## Scripts

| Script      | Descrição                            |
| ----------- | ------------------------------------ |
| `dev`       | Inicia o Metro bundler               |
| `android`   | Abre no emulador/dispositivo Android |
| `ios`       | Abre no simulador iOS                |
| `typecheck` | Roda `tsc --noEmit`                  |

## Variáveis de ambiente

| Variável              | Padrão                  | Uso                          |
| --------------------- | ----------------------- | ---------------------------- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000` | URL base da API (`apps/api`) |

> Em dispositivo físico, `localhost` aponta para o próprio celular. Use o IP da máquina na rede local (ex.: `http://192.168.0.10:3000`).

## Navegação e estrutura de pastas

A navegação usa **expo-router** (roteamento por arquivos). A entrada do app é `expo-router/entry` (campo `main` do `package.json`) e o plugin `expo-router` está registrado no `app.json`, junto com o scheme `orientatcc` para deep links.

O escopo segue a versão simplificada do documento de modelagem: os atores são **Aluno**, **Professor Orientador** e **Administrador** (mais o agendador e o Resend, que não têm tela). Coordenador de TCC e Membro da Banca foram removidos.

```
apps/mobile/
├── app/                          # rotas (cada arquivo é uma tela)
│   ├── _layout.tsx               # Stack raiz
│   ├── index.tsx                 # tela de entrada + seletor de perfil provisório
│   ├── notificacoes.tsx          # central de notificações (integrada à API)
│   ├── (aluno)/                  # perfil Aluno (Tabs)
│   │   ├── _layout.tsx
│   │   ├── proposta.tsx          # UC01: formulário da proposta e status
│   │   ├── meu-trabalho.tsx      # UC06: status das etapas, prazos e feedbacks
│   │   ├── entregas.tsx          # UC04: submissão de entregas versionadas
│   │   └── cronograma.tsx        # cronograma publicado pelo orientador
│   ├── (orientador)/             # perfil Orientador (Stack)
│   │   ├── _layout.tsx
│   │   ├── (tabs)/               # abas do orientador
│   │   │   ├── _layout.tsx
│   │   │   ├── propostas.tsx     # UC02: aceitar / ajustes / recusar, limite de orientandos
│   │   │   ├── orientandos.tsx   # UC09: painel de orientandos
│   │   │   └── entregas.tsx      # UC05: pendentes de avaliação e feedback
│   │   └── trabalho/
│   │       └── [id].tsx          # detalhe do trabalho: cronograma (UC03) e conclusão (UC08)
│   └── (admin)/                  # perfil Administrador (Tabs)
│       ├── _layout.tsx
│       ├── usuarios.tsx          # UC12: usuários e perfis
│       ├── cursos.tsx            # UC12: cursos e semestres
│       └── parametros.tsx        # UC12: limite de orientandos, domínio de e-mail
├── src/
│   ├── components/
│   │   ├── StatusApi.tsx         # consulta GET /health e mostra o resultado
│   │   ├── BotaoNotificacoes.tsx # botão 🔔 do cabeçalho que abre /notificacoes
│   │   ├── TelaPlaceholder.tsx   # tela provisória: título, UC, descrição e operações
│   │   └── IconeTab.tsx          # ícone de aba feito só com texto
│   └── lib/
│       ├── api.ts                # apiUrl(), api.get/patch tipados e ErroApi
│       ├── notificacoes.ts       # tipos e funções do Componente Notificação
│       └── sessao.tsx            # contexto provisório de sessão (usuário atual)
├── assets/                       # ícones e splash
├── app.json                      # configuração do Expo (plugins, scheme)
└── package.json
```

### Perfis e telas

| Perfil        | Grupo de rotas | Telas                                                        | Casos de uso           |
| ------------- | -------------- | ------------------------------------------------------------ | ---------------------- |
| Aluno         | `(aluno)`      | Proposta, Meu trabalho, Entregas, Cronograma                 | UC01, UC04, UC06       |
| Orientador    | `(orientador)` | Propostas, Orientandos, Entregas + detalhe `trabalho/[id]`   | UC02, UC03, UC05, UC08, UC09 |
| Administrador | `(admin)`      | Usuários, Cursos e semestres, Parâmetros                     | UC12                   |

Todas as telas são placeholders (`TelaPlaceholder`) com título, caso de uso, uma frase do que farão e a lista de operações identificadas na seção 2 do documento de modelagem (ex.: `verificarPropostaAtiva`, `cadastrarProposta`), que serve de guia para a implementação. A tela de proposta do aluno traz um formulário provisório (tema, resumo, objetivos, área e professor) que ainda não chama a API.

> **Seletor de perfil provisório.** A tela `index.tsx` mostra botões para entrar em cada grupo de perfil. Isso existe apenas para desenvolvimento e será substituído pelo login com **Better Auth** (UC11), que carregará o perfil e as permissões do usuário e direcionará para o grupo correto.

## Integração com a API

A primeira integração real é a **central de notificações** (`app/notificacoes.tsx`), que consome o Componente Notificação da API. Não usamos Eden: o cliente é um `fetch` tipado.

| Arquivo                    | Papel                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `src/lib/api.ts`           | `apiUrl()`, `api.get<T>(caminho)`, `api.patch<T>(caminho, body)` e a classe `ErroApi`   |
| `src/lib/notificacoes.ts`  | Tipos `Notificacao` / `TipoNotificacao` (espelham `apps/api/src/modules/notificacao/interface.ts`) e as funções `listarNotificacoes(destinatarioId)` e `marcarLida(id, usuarioId)` |
| `src/lib/sessao.tsx`       | Contexto provisório de sessão (`SessaoProvider`, `useSessao`) com o usuário atual        |
| `src/components/BotaoNotificacoes.tsx` | Botão 🔔 no cabeçalho das abas do aluno e do orientador que abre `/notificacoes` |

Rotas usadas:

- `GET /notificacoes?destinatarioId=<id>` devolve as notificações **ainda não lidas** do usuário, da mais recente para a mais antiga.
- `PATCH /notificacoes/:id/lida` com body `{ "usuarioId": <id> }` marca como lida (UC06 passo 3). Devolve 404 se não existe e 403 se pertence a outro usuário.

Tratamento de erro: toda resposta com status de erro vira um `ErroApi` com `status`, `mensagem` (lida do corpo `{ erro, mensagem }` da API ou do erro de validação) e `codigo` (ex.: `nao_encontrado`). Quando a API está fora do ar o `status` é `0` e a mensagem diz qual URL falhou, o que a tela mostra no estado de erro.

Comportamento da tela: estados de carregando, vazio e erro; pull-to-refresh; tocar em um item chama a API e marca o item como lido na lista. Como a listagem só devolve pendentes, o item lido some no próximo refresh.

### Sessão provisória

O seletor da tela de entrada grava no `SessaoProvider` um dos usuários criados pelo seed da API (`bun run db:seed` em `apps/api`):

| Botão         | Usuário          | id | perfil      |
| ------------- | ---------------- | -- | ----------- |
| Aluno         | Carlos Lima      | 3  | `aluno`     |
| Orientador    | Profa. Ana Souza | 2  | `professor` |
| Administrador | Administrador    | 1  | `admin`     |

Isso será substituído pela sessão do **Better Auth** (UC11); o `usuarioId` enviado no `PATCH` passará a vir da sessão autenticada.

Para gerar notificações de teste com a API rodando:

```bash
curl -X POST http://localhost:3000/notificacoes/teste \
  -H 'content-type: application/json' \
  -d '{"email":"carlos.lima@exemplo.edu.br","tipo":"prazo_proximo"}'
```

## Dependências de navegação

- `expo-router` — roteamento por arquivos
- `react-native-screens` e `react-native-safe-area-context` — peers do router
- `expo-linking` e `expo-constants` — deep links e scheme

Não há biblioteca de UI: os componentes usam apenas React Native puro. Os ícones das abas são texto, pois o SDK 57 não inclui `@expo/vector-icons` por padrão.
