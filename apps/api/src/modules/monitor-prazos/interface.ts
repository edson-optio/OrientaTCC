/**
 * Componente Monitor de Prazos — interface fornecida (IMonitorPrazos) e as
 * interfaces requeridas (ICronograma, IEntrega, IFeedback, INotificacao),
 * conforme a "Especificação e Modelagem de Componentes - OrientaTCC".
 *
 * Responsabilidade (UC07): executar periodicamente a verificação de prazos
 * próximos, entregas atrasadas e feedbacks pendentes, acionando as
 * notificações. O ator é o Tempo (agendador).
 */
import type { StatusEntrega } from "../../db/schema";
import type { INotificacao } from "../notificacao/interface";

export type { INotificacao } from "../notificacao/interface";

/** Fuso horário usado para "hoje" e para o agendamento diário. */
export const FUSO_HORARIO = "America/Sao_Paulo";

/** Dias de antecedência em que o aluno é alertado do prazo (UC07 passo 2). */
export const DIAS_ALERTA_PRAZO = [7, 2] as const;

/** Feedback sem leitura há mais que isso gera lembrete ao aluno (UC07 passo 4). */
export const DIAS_FEEDBACK_SEM_LEITURA = 2;

/** Dados mínimos de uma pessoa envolvida no trabalho (vêm de IUsuario). */
export interface Pessoa {
  id: number;
  nome: string;
  email: string;
}

/** Etapa de um cronograma publicado, com o contexto do trabalho. */
export interface EtapaComPrazo {
  etapaId: number;
  nome: string;
  /** Data limite ISO 8601 (AAAA-MM-DD). */
  prazo: string;
  trabalhoId: number;
  trabalhoTitulo: string;
  aluno: Pessoa;
  orientador: Pessoa | null;
}

/** Situação da entrega de um trabalho em uma etapa. */
export interface SituacaoEntrega {
  entregaId: number;
  status: StatusEntrega;
}

/** Feedback ainda não lido pelo aluno, com o contexto para notificar. */
export interface FeedbackNaoLido {
  feedbackId: number;
  versao: number;
  parecer: "aprovado" | "revisar";
  registradoEm: Date;
  etapaNome: string;
  trabalhoTitulo: string;
  aluno: Pessoa;
  orientador: Pessoa;
}

/** Resultado de uma execução da verificação. */
export interface ResumoVerificacao {
  /** Momento de referência usado como "agora". */
  executadaEm: string;
  /** Etapas sem entrega com prazo em 7 ou 2 dias. */
  prazosProximos: number;
  /** Etapas sem entrega com prazo vencido (marcadas como atrasadas). */
  atrasos: number;
  /** Feedbacks sem leitura há mais de 2 dias. */
  feedbacksNaoLidos: number;
  /** Notificações efetivamente geradas (descontadas as duplicadas do dia). */
  notificacoesGeradas: number;
}

/**
 * Interface fornecida IMonitorPrazos.
 *
 * Operação `verificarPrazos(agora)`
 * - Pré-condições:
 *   - só são consideradas etapas de cronogramas publicados
 *     (`publicado_em` não nulo) de trabalhos em orientação;
 *   - `agora` é uma data válida (padrão: momento atual).
 * - Pós-condições:
 *   - toda etapa com prazo vencido e sem entrega passa a ter a entrega com
 *     status "atrasada" (criando o registro da entrega se não existir);
 *   - para cada situação detectada são geradas notificações via INotificacao:
 *     `prazo_proximo` ao aluno (7 e 2 dias antes), `entrega_atrasada` ao
 *     aluno e ao orientador, `feedback_disponivel` ao aluno (feedback sem
 *     leitura há mais de 2 dias);
 *   - não há duplicação: uma notificação do mesmo tipo, para o mesmo
 *     destinatário e a mesma etapa, é gerada no máximo uma vez por dia
 *     (dia no fuso America/Sao_Paulo), então repetir a execução no mesmo
 *     dia não gera novas notificações.
 * - Regra: os alertas de prazo são emitidos exatamente 7 e 2 dias antes do
 *   prazo; "sem entrega" significa não existir entrega ou ela estar
 *   "pendente" ou já "atrasada".
 * - Resultado: `ResumoVerificacao` com as contagens da execução.
 */
export interface IMonitorPrazos {
  verificarPrazos(agora?: Date): Promise<ResumoVerificacao>;
}

/** Interface requerida ICronograma (Componente Cronograma). */
export interface ICronograma {
  /** Etapas com prazo de todos os cronogramas publicados de trabalhos em orientação. */
  listarEtapasComPrazo(): Promise<EtapaComPrazo[]>;
}

/** Interface requerida IEntrega (Componente Entregas). */
export interface IEntrega {
  /** Situação da entrega do trabalho na etapa, ou null se nada foi registrado. */
  consultarSituacao(
    trabalhoId: number,
    etapaId: number,
  ): Promise<SituacaoEntrega | null>;
  /** Marca a etapa como atrasada (cria a entrega "atrasada" se não existir). */
  marcarAtrasada(trabalhoId: number, etapaId: number): Promise<void>;
}

/** Interface requerida IFeedback (Componente Entregas). */
export interface IFeedback {
  /** Feedbacks com `lido_em` nulo registrados antes de `registradosAntesDe`. */
  listarNaoLidos(registradosAntesDe: Date): Promise<FeedbackNaoLido[]>;
}

/**
 * Critério de deduplicação: mesmo tipo, mesmo destinatário e mesma etapa
 * (identificada por nome da etapa e título do trabalho, que ficam no JSON
 * `dados` da notificação) no mesmo dia.
 */
export interface CriterioNotificacaoDia {
  destinatarioId: number;
  tipo: string;
  etapaNome: string;
  trabalhoTitulo: string;
  dia: Date;
}

/**
 * Consulta ao histórico de notificações, requerida para evitar duplicatas.
 * Complementa INotificacao até que ela ofereça `listarNotificacoes` com filtro.
 */
export interface IHistoricoNotificacao {
  jaNotificadaNoDia(criterio: CriterioNotificacaoDia): Promise<boolean>;
}

export type { INotificacao as INotificacaoRequerida };
