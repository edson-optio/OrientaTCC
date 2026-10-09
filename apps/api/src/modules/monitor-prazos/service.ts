/**
 * Implementação do Componente Monitor de Prazos (IMonitorPrazos), UC07.
 * Recebe as interfaces requeridas por injeção de dependência.
 */
import type {
  DadosNotificacao,
  Destinatario,
  TipoNotificacao,
} from "../notificacao/interface";
import { diaLocal, diasAte, menosDias } from "./datas";
import {
  DIAS_ALERTA_PRAZO,
  DIAS_FEEDBACK_SEM_LEITURA,
  type EtapaComPrazo,
  type ICronograma,
  type IEntrega,
  type IFeedback,
  type IHistoricoNotificacao,
  type IMonitorPrazos,
  type INotificacao,
  type Pessoa,
  type ResumoVerificacao,
  type SituacaoEntrega,
} from "./interface";

export interface DependenciasMonitor {
  cronograma: ICronograma;
  entregas: IEntrega;
  feedbacks: IFeedback;
  notificacao: INotificacao;
  historico: IHistoricoNotificacao;
}

/** "Sem entrega": nada registrado, ainda pendente ou já marcada como atrasada. */
function semEntrega(situacao: SituacaoEntrega | null): boolean {
  return (
    situacao === null ||
    situacao.status === "pendente" ||
    situacao.status === "atrasada"
  );
}

export class MonitorPrazosService implements IMonitorPrazos {
  constructor(private readonly deps: DependenciasMonitor) {}

  async verificarPrazos(agora: Date = new Date()): Promise<ResumoVerificacao> {
    if (Number.isNaN(agora.getTime())) {
      throw new Error("Data de referência inválida para a verificação.");
    }

    const resumo: ResumoVerificacao = {
      executadaEm: agora.toISOString(),
      prazosProximos: 0,
      atrasos: 0,
      feedbacksNaoLidos: 0,
      notificacoesGeradas: 0,
    };

    const etapas = await this.deps.cronograma.listarEtapasComPrazo();

    for (const etapa of etapas) {
      const situacao = await this.deps.entregas.consultarSituacao(
        etapa.trabalhoId,
        etapa.etapaId,
      );
      if (!semEntrega(situacao)) continue;

      const dias = diasAte(etapa.prazo, agora);

      if ((DIAS_ALERTA_PRAZO as readonly number[]).includes(dias)) {
        // UC07 passo 2: prazo próximo (7 e 2 dias) -> alerta ao aluno.
        resumo.prazosProximos += 1;
        resumo.notificacoesGeradas += await this.notificarSemDuplicar(
          etapa.aluno,
          "prazo_proximo",
          {
            trabalho: etapa.trabalhoTitulo,
            etapa: etapa.nome,
            prazo: etapa.prazo,
            diasRestantes: dias,
          },
          agora,
        );
      } else if (dias < 0) {
        // UC07 passo 3: prazo vencido -> etapa atrasada, aviso a aluno e orientador.
        resumo.atrasos += 1;
        await this.deps.entregas.marcarAtrasada(etapa.trabalhoId, etapa.etapaId);
        resumo.notificacoesGeradas += await this.notificarAtraso(etapa, -dias, agora);
      }
    }

    // UC07 passo 4: feedbacks ainda não lidos há mais de 2 dias.
    const limite = menosDias(agora, DIAS_FEEDBACK_SEM_LEITURA);
    const naoLidos = await this.deps.feedbacks.listarNaoLidos(limite);
    resumo.feedbacksNaoLidos = naoLidos.length;
    for (const feedback of naoLidos) {
      resumo.notificacoesGeradas += await this.notificarSemDuplicar(
        feedback.aluno,
        "feedback_disponivel",
        {
          trabalho: feedback.trabalhoTitulo,
          etapa: feedback.etapaNome,
          versao: feedback.versao,
          parecer: feedback.parecer,
          orientador: feedback.orientador.nome,
        },
        agora,
      );
    }

    return resumo;
  }

  private async notificarAtraso(
    etapa: EtapaComPrazo,
    diasAtraso: number,
    agora: Date,
  ): Promise<number> {
    const dados: DadosNotificacao["entrega_atrasada"] = {
      trabalho: etapa.trabalhoTitulo,
      etapa: etapa.nome,
      prazo: etapa.prazo,
      diasAtraso,
    };
    let geradas = await this.notificarSemDuplicar(
      etapa.aluno,
      "entrega_atrasada",
      dados,
      agora,
    );
    if (etapa.orientador) {
      geradas += await this.notificarSemDuplicar(
        etapa.orientador,
        "entrega_atrasada",
        dados,
        agora,
      );
    }
    return geradas;
  }

  /**
   * Gera a notificação só se ainda não houver uma do mesmo tipo, para o mesmo
   * destinatário e a mesma etapa/trabalho no dia de `agora`. Devolve 1 se
   * gerou e 0 se já existia.
   */
  private async notificarSemDuplicar<T extends TipoNotificacao>(
    destinatario: Pessoa,
    tipo: T,
    dados: DadosNotificacao[T] & { etapa: string; trabalho: string },
    agora: Date,
  ): Promise<number> {
    const duplicada = await this.deps.historico.jaNotificadaNoDia({
      destinatarioId: destinatario.id,
      tipo,
      etapaNome: dados.etapa,
      trabalhoTitulo: dados.trabalho,
      dia: agora,
    });
    if (duplicada) return 0;

    const alvo: Destinatario = {
      id: destinatario.id,
      nome: destinatario.nome,
      email: destinatario.email,
    };
    await this.deps.notificacao.notificar(alvo, tipo, dados);
    return 1;
  }
}

/** Exposto para diagnóstico: dia-calendário de referência da execução. */
export { diaLocal };
