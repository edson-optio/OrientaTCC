/**
 * Acesso ao Componente Notificacao da API (INotificacao via HTTP).
 * Os tipos espelham apps/api/src/modules/notificacao/interface.ts.
 */
import { api } from './api';

export const TIPOS_NOTIFICACAO = [
  'prazo_proximo',
  'entrega_atrasada',
  'feedback_disponivel',
  'proposta_status',
  'convite_orientacao',
  'convite_banca',
] as const;

export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

/** Rotulo em portugues de cada tipo, para exibicao. */
export const ROTULO_TIPO: Record<TipoNotificacao, string> = {
  prazo_proximo: 'Prazo proximo',
  entrega_atrasada: 'Entrega atrasada',
  feedback_disponivel: 'Feedback disponivel',
  proposta_status: 'Status da proposta',
  convite_orientacao: 'Convite de orientacao',
  convite_banca: 'Convite de banca',
};

/** Situacao do envio do e-mail associado a notificacao. */
export type StatusEnvio = 'enviado' | 'falhou';

/** Notificacao interna registrada pela API (tabela `notificacoes`). */
export interface Notificacao {
  id: number;
  destinatarioId: number;
  destinatarioEmail: string;
  tipo: TipoNotificacao;
  /** Dados especificos do tipo (usados pelos templates da API). */
  dados: Record<string, unknown>;
  /** Titulo da notificacao (assunto do e-mail). */
  assunto: string;
  html: string;
  envio: StatusEnvio;
  emailId: string | null;
  erroEnvio: string | null;
  tentativasEnvio: number;
  /** ISO 8601 ou null enquanto o e-mail nao foi aceito. */
  enviadaEm: string | null;
  /** ISO 8601. */
  criadaEm: string;
  /** ISO 8601 ou null enquanto pendente. */
  lidaEm: string | null;
}

/**
 * GET /notificacoes?destinatarioId=
 * Devolve as notificacoes ainda nao lidas do usuario, da mais recente para a
 * mais antiga. Notificacoes ja lidas nao aparecem nesta listagem.
 */
export function listarNotificacoes(destinatarioId: number): Promise<Notificacao[]> {
  return api.get<Notificacao[]>(`/notificacoes?destinatarioId=${destinatarioId}`);
}

/**
 * PATCH /notificacoes/:id/lida com { usuarioId } (UC06 passo 3).
 * TODO(autenticacao): o usuarioId passara a vir da sessao do Better Auth.
 */
export function marcarLida(id: number, usuarioId: number): Promise<Notificacao> {
  return api.patch<Notificacao>(`/notificacoes/${id}/lida`, { usuarioId });
}
