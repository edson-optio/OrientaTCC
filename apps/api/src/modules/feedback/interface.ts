import type { Ator } from '../entregas/interface';
export interface Feedback {
  id: number; versao_id: number; autor_id: number; parecer: 'aprovado' | 'revisar';
  comentarios: string | null; lido_em: Date | null; criado_em: Date; atualizado_em: Date;
}
export interface IFeedback {
  registrarFeedback(ator: Ator, versaoId: number, parecer: 'aprovado' | 'revisar', comentarios: string): Feedback;
  consultarFeedback(ator: Ator, trabalhoId: number): Feedback[];
  marcarFeedbackLido(ator: Ator, feedbackId: number): Feedback;
}
