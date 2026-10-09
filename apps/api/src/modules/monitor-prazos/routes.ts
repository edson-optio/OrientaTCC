/**
 * Plugin Elysia do Componente Monitor de Prazos.
 * Expõe a execução manual e o status sob o prefixo /monitor-prazos e monta o
 * agendador diário.
 */
import { Elysia, type AnyElysia } from "elysia";

import { db } from "../../db";
import { criarEmail } from "../notificacao/email";
import { RepositorioDrizzle } from "../notificacao/repositorio";
import { NotificacaoService } from "../notificacao/service";
import { criarAgendador, ExecutorMonitor } from "./agendador";
import {
  CronogramaDrizzle,
  EntregaDrizzle,
  FeedbackDrizzle,
  HistoricoNotificacaoDrizzle,
} from "./consultas";
import { MonitorPrazosService } from "./service";

const TAG = "Monitor de Prazos";

export function criarRotasMonitorPrazos(
  executor: ExecutorMonitor,
  agendador?: AnyElysia,
) {
  return new Elysia({ name: "modules/monitor-prazos", prefix: "/monitor-prazos" })
    .use(agendador ?? new Elysia({ name: "modules/monitor-prazos/sem-agendador" }))
    .post(
      "/executar",
      async ({ set }) => {
        const registro = await executor.executar("manual");
        if (registro.erro) {
          set.status = 500;
          return { erro: "falha_verificacao", mensagem: registro.erro };
        }
        return registro.resumo!;
      },
      {
        detail: {
          tags: [TAG],
          summary: "Executa agora a verificação de prazos (UC07) e devolve o resumo",
        },
      },
    )
    .get("/status", () => executor.status(), {
      detail: {
        tags: [TAG],
        summary: "Agendamento e última execução da verificação",
      },
    });
}

/** Plugin pronto para a aplicação: leitores Drizzle + Notificação real + cron diário. */
const executor = new ExecutorMonitor(
  new MonitorPrazosService({
    cronograma: new CronogramaDrizzle(db),
    entregas: new EntregaDrizzle(db),
    feedbacks: new FeedbackDrizzle(db),
    notificacao: new NotificacaoService(criarEmail(), new RepositorioDrizzle(db)),
    historico: new HistoricoNotificacaoDrizzle(db),
  }),
);

export const monitorPrazos = criarRotasMonitorPrazos(
  executor,
  criarAgendador(executor),
);
