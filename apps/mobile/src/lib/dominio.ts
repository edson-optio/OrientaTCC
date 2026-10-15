/**
 * Tipos do dominio espelhando os enums da API (apps/api/src/db/schema) e os
 * rotulos usados na interface.
 */

export type StatusEntrega =
  | 'pendente'
  | 'entregue'
  | 'entregue_com_atraso'
  | 'atrasada'
  | 'em_revisao'
  | 'aprovada';

export type StatusProposta = 'rascunho' | 'aguardando_orientador' | 'ajustes' | 'recusada' | 'aceita';

export type StatusTrabalho = 'aguardando_orientador' | 'em_orientacao' | 'concluido';

export type Parecer = 'aprovado' | 'revisar';

export type TipoEtapa = 'parcial' | 'final';

export interface Versao {
  id: number;
  numero: number;
  nome: string;
  tamanhoKb: number;
  enviadaEm: string;
  comAtraso: boolean;
}

export interface Feedback {
  id: number;
  versaoId: number;
  parecer: Parecer;
  comentarios: string;
  autor: string;
  criadoEm: string;
  lidoEm: string | null;
}

export interface Etapa {
  id: number;
  nome: string;
  tipo: TipoEtapa;
  obrigatoria: boolean;
  /** Data ISO (AAAA-MM-DD). */
  prazo: string;
  status: StatusEntrega;
  versoes: Versao[];
  feedbacks: Feedback[];
}

export interface Trabalho {
  id: number;
  titulo: string;
  aluno: string;
  curso: string;
  orientador: string;
  semestre: string;
  status: StatusTrabalho;
  cronogramaPublicadoEm: string | null;
  propostaAceitaEm: string;
  etapas: Etapa[];
}

export interface Proposta {
  id: number;
  aluno: string;
  curso: string;
  tema: string;
  resumo: string;
  objetivos: string;
  area: string;
  status: StatusProposta;
  submetidaEm: string;
  justificativa?: string;
}

/** Apresentacao de cada status: rotulo, icone e par de cores (texto, fundo). */
export type Tom = 'aprovada' | 'revisao' | 'revisar' | 'atrasada' | 'neutro';

export const STATUS_ENTREGA: Record<StatusEntrega, { rotulo: string; tom: Tom }> = {
  pendente: { rotulo: 'Pendente', tom: 'neutro' },
  entregue: { rotulo: 'Aguardando parecer', tom: 'revisao' },
  entregue_com_atraso: { rotulo: 'Entregue com atraso', tom: 'revisao' },
  atrasada: { rotulo: 'Atrasada', tom: 'atrasada' },
  em_revisao: { rotulo: 'Revisão pedida', tom: 'revisar' },
  aprovada: { rotulo: 'Aprovada', tom: 'aprovada' },
};

export const STATUS_PROPOSTA: Record<StatusProposta, { rotulo: string; tom: Tom }> = {
  rascunho: { rotulo: 'Rascunho', tom: 'neutro' },
  aguardando_orientador: { rotulo: 'Aguardando orientador', tom: 'revisao' },
  ajustes: { rotulo: 'Devolvida para ajustes', tom: 'revisar' },
  recusada: { rotulo: 'Recusada', tom: 'atrasada' },
  aceita: { rotulo: 'Aceita', tom: 'aprovada' },
};

export const PARECER: Record<Parecer, { rotulo: string; tom: Tom }> = {
  aprovado: { rotulo: 'Aprovado', tom: 'aprovada' },
  revisar: { rotulo: 'Revisar', tom: 'revisar' },
};
