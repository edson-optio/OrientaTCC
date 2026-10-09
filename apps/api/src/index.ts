import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";

import { health } from "./routes/health";
import { notificacao } from "./modules/notificacao/routes";
import { monitorPrazos } from "./modules/monitor-prazos/routes";
import { autenticacao } from "./modules/autenticacao/routes";

import { lab } from "./modules/lab/composicao";

const app = new Elysia()
  .use(cors())
  .use(
    openapi({
      path: "/docs",
      documentation: {
        info: {
          title: "OrientaTCC API",
          version: "0.0.0",
          description:
            "API do OrientaTCC: propostas, orientação, entregas, prazos e bancas de TCC.",
        },
        tags: [
          { name: "Health", description: "Verificação de saúde do serviço" },
          {
            name: "Notificações",
            description: "Notificações internas e envio de e-mail (Resend)",
          },
          {
            name: "Monitor de Prazos",
            description: "Verificação diária de prazos, atrasos e feedbacks (UC07)",
          },
        ],
      },
    }),
  )
  .use(health)
  .use(autenticacao)
  .use(lab)
  .use(notificacao)
  .use(monitorPrazos)
  .listen(Number(process.env.PORT ?? 3000));

console.log(
  `OrientaTCC API rodando em http://${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `Documentação disponível em http://${app.server?.hostname}:${app.server?.port}/docs`,
);

export type App = typeof app;
