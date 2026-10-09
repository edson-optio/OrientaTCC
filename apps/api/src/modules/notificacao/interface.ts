/**
 * Componente Notificação — interface fornecida (INotificacao) e interface
 * requerida (IEmail), conforme a "Especificação e Modelagem de Componentes -
 * OrientaTCC" (abordagem de Cheesman & Daniels).
 *
 * Responsabilidade do componente: criar as notificações internas do
 * aplicativo e solicitar o envio de e-mail aos destinatários (F04 / UC07),
 * delegando a entrega ao serviço externo Resend por meio de IEmail.
 */

/** Tipos de notificação suportados pelo OrientaTCC. */
export const TIPOS_NOTIFICACAO = [
  "prazo_proximo",
  "entrega_atrasada",
  "feedback_disponivel",
  "proposta_status",
  "convite_orientacao",
  "convite_banca",
] as const;

export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

/** Dados exigidos por cada tipo de notificação (usados pelos templates). */
export type DadosNotificacao = {
  /** UC07 passo 2: etapa com prazo próximo (7 e 2 dias). */
  prazo_proximo: {
    trabalho: string;
    etapa: string;
    /** Data do prazo no formato ISO 8601 (ex.: 2026-10-01). */
    prazo: string;
    diasRestantes: number;
  };
  /** UC07 passo 3: entrega em atraso. */
  entrega_atrasada: {
    trabalho: string;
    etapa: string;
    prazo: string;
    diasAtraso: number;
  };
  /** UC05 passo 4 / UC07 passo 4: feedback registrado pelo orientador. */
  feedback_disponivel: {
    trabalho: string;
    etapa: string;
    versao: number;
    parecer: "aprovado" | "revisar";
    orientador: string;
  };
  /** UC01/UC02: mudança de status da proposta de tema. */
  proposta_status: {
    tema: string;
    status: "aguardando_orientador" | "aceita" | "devolvida" | "recusada";
    professor: string;
    justificativa?: string;
  };
  /** UC01 passo 6: professor escolhido é convidado a orientar. */
  convite_orientacao: {
    aluno: string;
    tema: string;
    resumo: string;
  };
  /** Convite para compor a banca de um trabalho. */
  convite_banca: {
    trabalho: string;
    aluno: string;
    orientador: string;
    /** Data/hora da defesa em ISO 8601. */
    data: string;
    local: string;
  };
};

/** Quem recebe a notificação (dados mínimos obtidos de IUsuario). */
export interface Destinatario {
  /** Id do usuário na tabela `usuarios`. */
  id: number;
  nome: string;
  email: string;
}

/** Situação do envio do e-mail associado à notificação. */
export type StatusEnvio = "enviado" | "falhou";

/** Número máximo de tentativas de envio do e-mail (1 inicial + reagendamentos). */
export const MAX_TENTATIVAS_ENVIO = 3;

/** Notificação interna registrada pelo componente (tabela `notificacoes`). */
export interface Notificacao<T extends TipoNotificacao = TipoNotificacao> {
  id: number;
  destinatarioId: number;
  destinatarioEmail: string;
  tipo: T;
  dados: DadosNotificacao[T];
  assunto: string;
  html: string;
  /** Situação do envio do e-mail (UC07 A1: falha mantém a notificação). */
  envio: StatusEnvio;
  /** Identificador devolvido pelo serviço de e-mail quando o envio deu certo. */
  emailId: string | null;
  /** Mensagem de erro do serviço de e-mail na última tentativa que falhou. */
  erroEnvio: string | null;
  /** Quantas vezes o envio do e-mail já foi tentado. */
  tentativasEnvio: number;
  /** Momento em que o e-mail foi aceito pelo provedor; null enquanto falho. */
  enviadaEm: string | null;
  criadaEm: string;
  /** Data em que o destinatário leu a notificação; null enquanto pendente. */
  lidaEm: string | null;
}

/** Resumo devolvido por `reagendarEnvio()`. */
export interface ResultadoReagendamento {
  /** Notificações com envio falho e tentativas abaixo do máximo. */
  processadas: number;
  reenviadas: number;
  falhas: number;
}

/**
 * Interface fornecida INotificacao.
 *
 * Operação `notificar(destinatario, tipo, dados)`
 * - Pré-condições:
 *   - `destinatario.id` deve ser um inteiro positivo (usuário existente) e
 *     `destinatario.email` não pode ser vazio e deve ter formato válido;
 *   - `tipo` deve ser um dos valores de `TIPOS_NOTIFICACAO`;
 *   - `dados` deve conter os campos exigidos pelo template do tipo.
 * - Pós-condições:
 *   - uma notificação interna é registrada na tabela `notificacoes` com
 *     assunto e HTML gerados pelo template do tipo, ainda não lida
 *     (`lidaEm === null`) e com `tentativasEnvio === 1`;
 *   - o envio do e-mail é solicitado a IEmail com o assunto e o HTML gerados;
 *   - se o serviço de e-mail falhar, a notificação interna é mantida com
 *     `envio === "falhou"` e o erro registrado (UC07 A1), sem propagar exceção.
 * - Regra: o componente decide "quando e o que" notificar; a entrega do
 *   e-mail é sempre delegada ao serviço externo (Resend) via IEmail.
 * - Resultado: a notificação registrada.
 * - Violação de pré-condição: rejeita com `ErroPreCondicao`.
 *
 * Operação `listarPendentes(filtro?)`
 * - Pré-condições: nenhuma.
 * - Pós-condições: nenhum estado é alterado.
 * - Resultado: as notificações ainda não lidas, da mais recente para a mais
 *   antiga; com `filtro.destinatarioId` devolve só as daquele usuário.
 *
 * Operação `marcarNotificacaoLida(notificacaoId, usuarioId)` (UC06 passo 3)
 * - Pré-condições:
 *   - existe notificação com `notificacaoId` (senão `ErroNaoEncontrado`);
 *   - a notificação pertence a `usuarioId` (senão `ErroAcessoNegado`).
 * - Pós-condições: `lidaEm` recebe o momento da leitura; se já estava lida,
 *   a data original é preservada (operação idempotente).
 * - Resultado: a notificação atualizada.
 *
 * Operação `reagendarEnvio()` (UC07 A1)
 * - Pré-condições: nenhuma.
 * - Pós-condições: para cada notificação com `envio === "falhou"` e menos de
 *   `MAX_TENTATIVAS_ENVIO` tentativas, o envio é tentado outra vez via IEmail e
 *   `tentativasEnvio` é incrementado; em sucesso `envio` vira "enviado" com
 *   `emailId` e `enviadaEm`; em falha `erroEnvio` é atualizado. Notificações
 *   que atingiram o máximo de tentativas não são mais reenviadas.
 * - Regra: a notificação interna nunca é descartada por falha de e-mail.
 * - Resultado: contagem de processadas, reenviadas e falhas.
 */
export interface INotificacao {
  notificar<T extends TipoNotificacao>(
    destinatario: Destinatario,
    tipo: T,
    dados: DadosNotificacao[T],
  ): Promise<Notificacao<T>>;

  listarPendentes(filtro?: FiltroNotificacao): Promise<Notificacao[]>;

  marcarNotificacaoLida(
    notificacaoId: number,
    usuarioId: number,
  ): Promise<Notificacao>;

  reagendarEnvio(): Promise<ResultadoReagendamento>;
}

/** Filtro opcional das listagens. */
export interface FiltroNotificacao {
  destinatarioId?: number;
}

/** Mensagem de e-mail pedida ao serviço externo. */
export interface MensagemEmail {
  para: string;
  assunto: string;
  html: string;
}

/**
 * Interface requerida IEmail (fornecida pelo serviço externo Resend).
 *
 * Operação `enviarEmail({ para, assunto, html })`
 * - Pré-condições: `para` é um e-mail válido; `assunto` e `html` não vazios.
 * - Pós-condições: o e-mail é aceito pelo provedor para entrega.
 * - Resultado: `{ id }` com o identificador da mensagem no provedor.
 * - Falha: rejeita com erro descrevendo o motivo informado pelo provedor.
 */
export interface IEmail {
  enviarEmail(mensagem: MensagemEmail): Promise<{ id: string }>;
}

/** Erro lançado quando uma pré-condição do contrato é violada. */
export class ErroPreCondicao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroPreCondicao";
  }
}

/** Erro lançado quando a notificação informada não existe. */
export class ErroNaoEncontrado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroNaoEncontrado";
  }
}

/** Erro lançado quando o usuário tenta agir sobre notificação de outra pessoa. */
export class ErroAcessoNegado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroAcessoNegado";
  }
}
