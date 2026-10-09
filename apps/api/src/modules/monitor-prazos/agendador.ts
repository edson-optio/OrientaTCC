/**
 * Agendador do Monitor de Prazos (ator Tempo do UC07): dispara a verificação
 * diariamente às 07:00 no fuso America/Sao_Paulo com @elysiajs/cron.
 * Desligável com MONITOR_PRAZOS_CRON=off.
 */
import { cron } from "@elysiajs/cron";
import { Elysia, type AnyElysia } from "elysia";

import { FUSO_HORARIO, type IMonitorPrazos, type ResumoVerificacao } from "./interface";

export const NOME_CRON = "monitor-prazos";
export const PADRAO_CRON = "0 7 * * *";

export type OrigemExecucao = "agendador" | "manual";

export interface RegistroExecucao {
  origem: OrigemExecucao;
  iniciadaEm: string;
  terminadaEm: string;
  resumo: ResumoVerificacao | null;
  erro: string | null;
}

export interface StatusMonitor {
  agendamento: {
    ativo: boolean;
    padrao: string;
    fusoHorario: string;
    proximaExecucao: string | null;
  };
  ultimaExecucao: RegistroExecucao | null;
}

/**
 * Executa a verificação registrando a última execução. Compartilhado pela
 * rota manual e pelo agendador para que GET /status reflita ambos.
 */
export class ExecutorMonitor {
  private ultima: RegistroExecucao | null = null;
  private proximaExecucao: (() => Date | null) | null = null;

  constructor(private readonly monitor: IMonitorPrazos) {}

  async executar(origem: OrigemExecucao): Promise<RegistroExecucao> {
    const iniciadaEm = new Date();
    let registro: RegistroExecucao;
    try {
      const resumo = await this.monitor.verificarPrazos(iniciadaEm);
      registro = {
        origem,
        iniciadaEm: iniciadaEm.toISOString(),
        terminadaEm: new Date().toISOString(),
        resumo,
        erro: null,
      };
    } catch (erro) {
      registro = {
        origem,
        iniciadaEm: iniciadaEm.toISOString(),
        terminadaEm: new Date().toISOString(),
        resumo: null,
        erro: erro instanceof Error ? erro.message : String(erro),
      };
      console.error(`[monitor-prazos] falha na verificação (${origem}): ${registro.erro}`);
    }
    this.ultima = registro;
    return registro;
  }

  definirProximaExecucao(consulta: (() => Date | null) | null): void {
    this.proximaExecucao = consulta;
  }

  status(): StatusMonitor {
    return {
      agendamento: {
        ativo: this.proximaExecucao !== null,
        padrao: PADRAO_CRON,
        fusoHorario: FUSO_HORARIO,
        proximaExecucao: this.proximaExecucao?.()?.toISOString() ?? null,
      },
      ultimaExecucao: this.ultima,
    };
  }
}

export function cronDesligado(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.MONITOR_PRAZOS_CRON ?? "").trim().toLowerCase() === "off";
}

/** Plugin Elysia que registra o cron diário (ou nada, se desligado por env). */
export function criarAgendador(
  executor: ExecutorMonitor,
  env: NodeJS.ProcessEnv = process.env,
): AnyElysia {
  const plugin = new Elysia({ name: "modules/monitor-prazos/agendador" });
  if (cronDesligado(env)) {
    console.log("[monitor-prazos] agendador desligado (MONITOR_PRAZOS_CRON=off).");
    return plugin;
  }

  return plugin.use(
    cron({
      name: NOME_CRON,
      pattern: PADRAO_CRON,
      timezone: FUSO_HORARIO,
      protect: true,
      run: async (tarefa) => {
        executor.definirProximaExecucao(() => tarefa.nextRun());
        const registro = await executor.executar("agendador");
        if (registro.resumo) {
          const r = registro.resumo;
          console.log(
            `[monitor-prazos] verificação diária: ${r.prazosProximos} prazos próximos, ${r.atrasos} atrasos, ${r.feedbacksNaoLidos} feedbacks não lidos, ${r.notificacoesGeradas} notificações.`,
          );
        }
      },
    }),
  ).onStart(({ store }) => {
    const tarefa = (store as { cron?: Record<string, { nextRun: () => Date | null }> })
      .cron?.[NOME_CRON];
    if (tarefa) {
      executor.definirProximaExecucao(() => tarefa.nextRun());
      console.log(
        `[monitor-prazos] agendado "${PADRAO_CRON}" (${FUSO_HORARIO}); próxima execução ${tarefa.nextRun()?.toISOString() ?? "indefinida"}.`,
      );
    }
  });
}
