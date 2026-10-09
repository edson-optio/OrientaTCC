/**
 * Repositório do Componente Notificação: persistência das notificações na
 * tabela `notificacoes` (Drizzle) e uma implementação em memória para testes.
 *
 * Mapeamento para as colunas existentes (o schema é mantido pelo módulo db):
 * - `titulo`  <- assunto do e-mail
 * - `mensagem` <- HTML do e-mail
 * - `dados` (JSON) <- { conteudo: dados tipados do tipo, destinatarioEmail,
 *   emailId, erroEnvio }
 * - `enviada_em` nulo significa envio falho (pendente de reagendamento)
 * - `tentativas_envio` conta as tentativas de envio do e-mail
 */
import { and, desc, eq, isNull, lt } from "drizzle-orm";

import type { Db } from "../../db";
import { notificacoes } from "../../db/schema";
import type {
  DadosNotificacao,
  FiltroNotificacao,
  Notificacao,
  StatusEnvio,
  TipoNotificacao,
} from "./interface";

/** Dados necessários para registrar uma notificação recém-criada. */
export interface NovaNotificacao {
  destinatarioId: number;
  destinatarioEmail: string;
  tipo: TipoNotificacao;
  dados: DadosNotificacao[TipoNotificacao];
  assunto: string;
  html: string;
  envio: StatusEnvio;
  emailId: string | null;
  erroEnvio: string | null;
  tentativasEnvio: number;
}

/** Resultado de uma tentativa de envio a registrar. */
export interface AtualizacaoEnvio {
  envio: StatusEnvio;
  emailId: string | null;
  erroEnvio: string | null;
  tentativasEnvio: number;
}

export interface INotificacaoRepositorio {
  /** Persiste a notificação e devolve o registro com id e datas. */
  salvar(nova: NovaNotificacao): Promise<Notificacao>;
  /** Devolve a notificação ou null se não existir. */
  buscarPorId(id: number): Promise<Notificacao | null>;
  /** Não lidas, da mais recente para a mais antiga, opcionalmente por destinatário. */
  listarPendentes(filtro?: FiltroNotificacao): Promise<Notificacao[]>;
  /**
   * Marca como lida se a notificação existir e pertencer a `usuarioId`;
   * devolve null nos demais casos. Preserva `lidaEm` se já estava lida.
   */
  marcarLida(id: number, usuarioId: number): Promise<Notificacao | null>;
  /** Com envio falho e menos de `maxTentativas` tentativas, da mais antiga para a mais nova. */
  listarComEnvioFalho(maxTentativas: number): Promise<Notificacao[]>;
  /** Registra o resultado de uma nova tentativa de envio. */
  atualizarEnvio(id: number, envio: AtualizacaoEnvio): Promise<Notificacao>;
}

/* ---------------------------------------------------------------------- */
/* Implementação Drizzle (tabela `notificacoes`)                            */
/* ---------------------------------------------------------------------- */

/** Formato guardado na coluna JSON `dados`. */
interface DadosPersistidos {
  conteudo: DadosNotificacao[TipoNotificacao];
  destinatarioEmail: string;
  emailId: string | null;
  erroEnvio: string | null;
}

type Linha = typeof notificacoes.$inferSelect;

function paraIso(data: Date | null | undefined): string | null {
  return data ? data.toISOString() : null;
}

function linhaParaNotificacao(linha: Linha): Notificacao {
  const extras = (linha.dados ?? {}) as Partial<DadosPersistidos>;
  return {
    id: linha.id,
    destinatarioId: linha.destinatario_id,
    destinatarioEmail: extras.destinatarioEmail ?? "",
    tipo: linha.tipo as TipoNotificacao,
    dados: (extras.conteudo ?? {}) as DadosNotificacao[TipoNotificacao],
    assunto: linha.titulo,
    html: linha.mensagem ?? "",
    envio: linha.enviada_em ? "enviado" : "falhou",
    emailId: extras.emailId ?? null,
    erroEnvio: extras.erroEnvio ?? null,
    tentativasEnvio: linha.tentativas_envio,
    enviadaEm: paraIso(linha.enviada_em),
    criadaEm: linha.criado_em.toISOString(),
    lidaEm: paraIso(linha.lida_em),
  };
}

export class RepositorioDrizzle implements INotificacaoRepositorio {
  constructor(private readonly db: Db) {}

  async salvar(nova: NovaNotificacao): Promise<Notificacao> {
    const dados: DadosPersistidos = {
      conteudo: nova.dados,
      destinatarioEmail: nova.destinatarioEmail,
      emailId: nova.emailId,
      erroEnvio: nova.erroEnvio,
    };
    const [linha] = await this.db
      .insert(notificacoes)
      .values({
        destinatario_id: nova.destinatarioId,
        tipo: nova.tipo,
        titulo: nova.assunto,
        mensagem: nova.html,
        dados: dados as unknown as Record<string, unknown>,
        enviada_em: nova.envio === "enviado" ? new Date() : null,
        tentativas_envio: nova.tentativasEnvio,
      })
      .returning();
    return linhaParaNotificacao(linha!);
  }

  async buscarPorId(id: number): Promise<Notificacao | null> {
    const linha = await this.db.query.notificacoes.findFirst({
      where: eq(notificacoes.id, id),
    });
    return linha ? linhaParaNotificacao(linha) : null;
  }

  async listarPendentes(filtro: FiltroNotificacao = {}): Promise<Notificacao[]> {
    const condicoes = [isNull(notificacoes.lida_em)];
    if (filtro.destinatarioId !== undefined) {
      condicoes.push(eq(notificacoes.destinatario_id, filtro.destinatarioId));
    }
    const linhas = await this.db
      .select()
      .from(notificacoes)
      .where(and(...condicoes))
      .orderBy(desc(notificacoes.criado_em), desc(notificacoes.id));
    return linhas.map(linhaParaNotificacao);
  }

  async marcarLida(id: number, usuarioId: number): Promise<Notificacao | null> {
    const atual = await this.buscarPorId(id);
    if (!atual || atual.destinatarioId !== usuarioId) return null;
    if (atual.lidaEm) return atual;

    const [linha] = await this.db
      .update(notificacoes)
      .set({ lida_em: new Date() })
      .where(eq(notificacoes.id, id))
      .returning();
    return linhaParaNotificacao(linha!);
  }

  async listarComEnvioFalho(maxTentativas: number): Promise<Notificacao[]> {
    const linhas = await this.db
      .select()
      .from(notificacoes)
      .where(
        and(
          isNull(notificacoes.enviada_em),
          lt(notificacoes.tentativas_envio, maxTentativas),
        ),
      )
      .orderBy(notificacoes.criado_em, notificacoes.id);
    return linhas.map(linhaParaNotificacao);
  }

  async atualizarEnvio(id: number, envio: AtualizacaoEnvio): Promise<Notificacao> {
    const atual = await this.buscarPorId(id);
    if (!atual) {
      throw new Error(`Notificação ${id} não encontrada para atualizar envio.`);
    }
    const dados: DadosPersistidos = {
      conteudo: atual.dados,
      destinatarioEmail: atual.destinatarioEmail,
      emailId: envio.emailId,
      erroEnvio: envio.erroEnvio,
    };
    const [linha] = await this.db
      .update(notificacoes)
      .set({
        dados: dados as unknown as Record<string, unknown>,
        enviada_em: envio.envio === "enviado" ? new Date() : null,
        tentativas_envio: envio.tentativasEnvio,
      })
      .where(eq(notificacoes.id, id))
      .returning();
    return linhaParaNotificacao(linha!);
  }
}

/* ---------------------------------------------------------------------- */
/* Implementação em memória (testes)                                        */
/* ---------------------------------------------------------------------- */

export class RepositorioMemoria implements INotificacaoRepositorio {
  private readonly itens: Notificacao[] = [];
  private proximoId = 1;

  async salvar(nova: NovaNotificacao): Promise<Notificacao> {
    const agora = new Date().toISOString();
    const notificacao: Notificacao = {
      id: this.proximoId++,
      destinatarioId: nova.destinatarioId,
      destinatarioEmail: nova.destinatarioEmail,
      tipo: nova.tipo,
      dados: nova.dados,
      assunto: nova.assunto,
      html: nova.html,
      envio: nova.envio,
      emailId: nova.emailId,
      erroEnvio: nova.erroEnvio,
      tentativasEnvio: nova.tentativasEnvio,
      enviadaEm: nova.envio === "enviado" ? agora : null,
      criadaEm: agora,
      lidaEm: null,
    };
    this.itens.push(notificacao);
    return structuredClone(notificacao);
  }

  async buscarPorId(id: number): Promise<Notificacao | null> {
    const item = this.itens.find((n) => n.id === id);
    return item ? structuredClone(item) : null;
  }

  async listarPendentes(filtro: FiltroNotificacao = {}): Promise<Notificacao[]> {
    return this.itens
      .filter(
        (n) =>
          n.lidaEm === null &&
          (filtro.destinatarioId === undefined ||
            n.destinatarioId === filtro.destinatarioId),
      )
      .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm) || b.id - a.id)
      .map((n) => structuredClone(n));
  }

  async marcarLida(id: number, usuarioId: number): Promise<Notificacao | null> {
    const item = this.itens.find((n) => n.id === id);
    if (!item || item.destinatarioId !== usuarioId) return null;
    item.lidaEm ??= new Date().toISOString();
    return structuredClone(item);
  }

  async listarComEnvioFalho(maxTentativas: number): Promise<Notificacao[]> {
    return this.itens
      .filter((n) => n.envio === "falhou" && n.tentativasEnvio < maxTentativas)
      .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm) || a.id - b.id)
      .map((n) => structuredClone(n));
  }

  async atualizarEnvio(id: number, envio: AtualizacaoEnvio): Promise<Notificacao> {
    const item = this.itens.find((n) => n.id === id);
    if (!item) {
      throw new Error(`Notificação ${id} não encontrada para atualizar envio.`);
    }
    item.envio = envio.envio;
    item.emailId = envio.emailId;
    item.erroEnvio = envio.erroEnvio;
    item.tentativasEnvio = envio.tentativasEnvio;
    item.enviadaEm = envio.envio === "enviado" ? new Date().toISOString() : null;
    return structuredClone(item);
  }
}
