# Módulos (componentes) da API

> Lab 4: a referência atual está no README da raiz e em `docs/lab4`. O catálogo abaixo registra a base anterior, que difere do Lab 3 fornecido. Os componentes implementados neste lab são `entregas` (IEntrega) e `feedback` (IFeedback), em pastas separadas. Monitor de Prazos e Notificação são módulos preexistentes fora do recorte.

Cada pasta aqui é um componente da arquitetura definida no documento
"Especificação e Modelagem de Componentes - OrientaTCC" (abordagem de
Cheesman & Daniels: operações agrupadas por responsabilidade, interfaces
fornecidas/requeridas e contratos com pré e pós-condições).

Escopo simplificado: os atores são Aluno, Professor Orientador e
Administrador (mais o agendador de prazos e o Resend). Coordenador de TCC e
Membro da Banca foram removidos; a aprovação da proposta, o cronograma e o
resultado final ficam a cargo do próprio orientador.

Convenção por componente:

- `interface.ts` — a interface fornecida (contrato: operações, pré/pós-condições)
- `service.ts` — a implementação; recebe as interfaces requeridas por injeção de dependência
- `routes.ts` — o plugin Elysia que expõe as operações via HTTP

| Pasta            | Componente                      | Interfaces fornecidas |
| ---------------- | ------------------------------- | --------------------- |
| `autenticacao`   | Autenticação (Better Auth)      | IAutenticacao         |
| `cadastros`      | Cadastros                       | IUsuario, IParametro  |
| `proposta`       | Proposta                        | IProposta             |
| `orientacao`     | Orientação                      | IOrientacao           |
| `trabalho`       | Trabalho                        | ITrabalho             |
| `cronograma`     | Cronograma                      | ICronograma           |
| `entregas`       | Entregas                        | IEntrega   |
| `feedback`      | Feedback                        | IFeedback             |
| `arquivos`       | Arquivos                        | IArquivo              |
| `monitor-prazos` | Monitor de Prazos               | IMonitorPrazos        |
| `notificacao`    | Notificação (usa Resend/IEmail) | INotificacao          |

As dependências do Lab 4 estão em `docs/lab4/componentes-implementados.puml`, a partir da raiz do repositório.
