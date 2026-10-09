# Demonstração do Lab 4 — roteiro de 7 minutos

Grave sua tela e explique o código com suas palavras. O roteiro foi preparado; o vídeo ainda precisa ser gravado pela equipe.

| Tempo | Mostrar e explicar |
|---|---|
| 0:00–0:45 | Apresentar OrientaTCC e equipe. Selecionamos Entregas e Feedback do Lab 3, ligados aos casos UC04, UC05 e UC06. |
| 0:45–1:30 | Abrir o diagrama no README. Entregas requer ICronograma, que decide o vencimento; Feedback requer IEntrega. Entregas é o dono da situação da entrega. A API autentica e delega. |
| 1:30–2:30 | Abrir os dois `interface.ts`. Mostrar submissão, consulta, pendências, parecer e leitura. Explicar pré e pós-condições na especificação. |
| 2:30–3:30 | Abrir os dois `service.ts` e `lab/composicao.ts`. Apontar a injeção de IEntrega no Feedback e a chamada `atualizarSituacao`. Explicar a separação Proposta/TCC na arquitetura revisada e que Feedback solicita a transição, mas Entregas a aplica. |
| 3:30–4:10 | Executar o teste de Entregas abaixo. Mostrar versões 1 e 2 e preservação do arquivo. |
| 4:10–4:50 | Executar o teste de Feedback abaixo. Mostrar autorização e leitura idempotente. |
| 4:50–5:40 | Executar o teste de integração. Explicar entregue → em revisão → nova versão → aprovada. Mostrar também o teste de rollback se houver tempo. |
| 5:40–6:30 | Executar `bun run demo:lab`, ler os sete resultados e mostrar que há duas versões e dois pareceres preservados. |
| 6:30–7:00 | Mostrar pasta de evidências e documento. Explicar limites do recorte e mostrar o commit no GitHub quando publicado. |

Comandos a partir da raiz:

```sh
bun test apps/api/src/modules/lab/componentes.test.ts -t 'preserva arquivo'
bun test apps/api/src/modules/lab/componentes.test.ts -t 'somente orientador'
bun test apps/api/src/modules/lab/componentes.test.ts -t 'submissão → revisão'
bun run demo:lab
```

Antes de gravar: instale dependências, aumente a fonte do editor/terminal, feche arquivos com segredos e confira o áudio. Não apresente toda a suíte como aprovada: há uma falha preexistente de deduplicação no Monitor de Prazos, descrita no README, fora do escopo deste lab.

Checklist da entrega: revisar nomes da equipe e documento; confirmar arquivos no GitHub; gravar vídeo de 5–8 minutos; inserir o link do vídeo no local solicitado pelo professor.
