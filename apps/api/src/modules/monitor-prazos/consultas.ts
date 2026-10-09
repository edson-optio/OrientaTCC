/**
 * Leitores mínimos sobre o Drizzle que cumprem as interfaces requeridas do
 * Monitor de Prazos (ICronograma, IEntrega, IFeedback, IHistoricoNotificacao).
 *
 * PROVISÓRIO: quando os Componentes Cronograma e Entregas existirem, estas
 * classes serão substituídas pelos serviços reais que fornecem ICronograma,
 * IEntrega e IFeedback; o Componente Notificação passará a oferecer a
 * consulta de histórico. A lógica do monitor (service.ts) não muda.
 */
import { and, eq, gte, inArray, isNotNull, isNull, lt } from "drizzle-orm";

import type { Db } from "../../db";
import {
  cronogramas,
  entregas,
  etapas,
  feedbacks,
  notificacoes,
  trabalhos,
  usuarios,
  versoes,
} from "../../db/schema";
import { diaLocal, menosDias } from "./datas";
import type {
  CriterioNotificacaoDia,
  EtapaComPrazo,
  FeedbackNaoLido,
  ICronograma,
  IEntrega,
  IFeedback,
  IHistoricoNotificacao,
  Pessoa,
  SituacaoEntrega,
} from "./interface";

/** Carrega id/nome/e-mail dos usuários informados, indexados por id. */
async function carregarPessoas(
  db: Db,
  ids: Array<number | null>,
): Promise<Map<number, Pessoa>> {
  const unicos = [...new Set(ids.filter((id): id is number => id !== null))];
  const mapa = new Map<number, Pessoa>();
  if (unicos.length === 0) return mapa;
  const linhas = await db
    .select({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email })
    .from(usuarios)
    .where(inArray(usuarios.id, unicos));
  for (const u of linhas) mapa.set(u.id, u);
  return mapa;
}

/** Etapas de cronogramas publicados de trabalhos em orientação. */
export class CronogramaDrizzle implements ICronograma {
  constructor(private readonly db: Db) {}

  async listarEtapasComPrazo(): Promise<EtapaComPrazo[]> {
    const linhas = await this.db
      .select({
        etapaId: etapas.id,
        nome: etapas.nome,
        prazo: etapas.prazo,
        trabalhoId: trabalhos.id,
        trabalhoTitulo: trabalhos.titulo,
        alunoId: trabalhos.aluno_id,
        orientadorId: trabalhos.orientador_id,
      })
      .from(etapas)
      .innerJoin(cronogramas, eq(etapas.cronograma_id, cronogramas.id))
      .innerJoin(trabalhos, eq(cronogramas.trabalho_id, trabalhos.id))
      .where(
        and(
          isNotNull(cronogramas.publicado_em),
          eq(trabalhos.status, "em_orientacao"),
        ),
      )
      .orderBy(etapas.prazo, etapas.id);

    const pessoas = await carregarPessoas(
      this.db,
      linhas.flatMap((l) => [l.alunoId, l.orientadorId]),
    );

    return linhas.flatMap((l) => {
      const aluno = pessoas.get(l.alunoId);
      if (!aluno) return [];
      return [
        {
          etapaId: l.etapaId,
          nome: l.nome,
          prazo: l.prazo,
          trabalhoId: l.trabalhoId,
          trabalhoTitulo: l.trabalhoTitulo,
          aluno,
          orientador:
            l.orientadorId !== null ? (pessoas.get(l.orientadorId) ?? null) : null,
        },
      ];
    });
  }
}

/** Situação e marcação de atraso na tabela `entregas`. */
export class EntregaDrizzle implements IEntrega {
  constructor(private readonly db: Db) {}

  async consultarSituacao(
    trabalhoId: number,
    etapaId: number,
  ): Promise<SituacaoEntrega | null> {
    const linha = await this.db.query.entregas.findFirst({
      columns: { id: true, status: true },
      where: and(
        eq(entregas.trabalho_id, trabalhoId),
        eq(entregas.etapa_id, etapaId),
      ),
    });
    return linha ? { entregaId: linha.id, status: linha.status } : null;
  }

  async marcarAtrasada(trabalhoId: number, etapaId: number): Promise<void> {
    const atual = await this.consultarSituacao(trabalhoId, etapaId);
    if (!atual) {
      await this.db
        .insert(entregas)
        .values({ trabalho_id: trabalhoId, etapa_id: etapaId, status: "atrasada" });
      return;
    }
    if (atual.status !== "atrasada") {
      await this.db
        .update(entregas)
        .set({ status: "atrasada" })
        .where(eq(entregas.id, atual.entregaId));
    }
  }
}

/** Feedbacks com `lido_em` nulo, com o contexto de etapa/trabalho/pessoas. */
export class FeedbackDrizzle implements IFeedback {
  constructor(private readonly db: Db) {}

  async listarNaoLidos(registradosAntesDe: Date): Promise<FeedbackNaoLido[]> {
    const linhas = await this.db
      .select({
        feedbackId: feedbacks.id,
        parecer: feedbacks.parecer,
        registradoEm: feedbacks.criado_em,
        autorId: feedbacks.autor_id,
        versao: versoes.numero,
        etapaNome: etapas.nome,
        trabalhoTitulo: trabalhos.titulo,
        alunoId: trabalhos.aluno_id,
      })
      .from(feedbacks)
      .innerJoin(versoes, eq(feedbacks.versao_id, versoes.id))
      .innerJoin(entregas, eq(versoes.entrega_id, entregas.id))
      .innerJoin(etapas, eq(entregas.etapa_id, etapas.id))
      .innerJoin(trabalhos, eq(entregas.trabalho_id, trabalhos.id))
      .where(
        and(isNull(feedbacks.lido_em), lt(feedbacks.criado_em, registradosAntesDe)),
      )
      .orderBy(feedbacks.criado_em, feedbacks.id);

    const pessoas = await carregarPessoas(
      this.db,
      linhas.flatMap((l) => [l.alunoId, l.autorId]),
    );

    return linhas.flatMap((l) => {
      const aluno = pessoas.get(l.alunoId);
      const orientador = pessoas.get(l.autorId);
      if (!aluno || !orientador) return [];
      return [
        {
          feedbackId: l.feedbackId,
          versao: l.versao,
          parecer: l.parecer,
          registradoEm: l.registradoEm,
          etapaNome: l.etapaNome,
          trabalhoTitulo: l.trabalhoTitulo,
          aluno,
          orientador,
        },
      ];
    });
  }
}

/**
 * Histórico de notificações na tabela `notificacoes`: identifica a etapa
 * pelo JSON `dados` (`conteudo.etapa` e `conteudo.trabalho`) e o dia pelo
 * `criado_em` convertido para o fuso de São Paulo.
 */
export class HistoricoNotificacaoDrizzle implements IHistoricoNotificacao {
  constructor(private readonly db: Db) {}

  async jaNotificadaNoDia(criterio: CriterioNotificacaoDia): Promise<boolean> {
    // Janela de 2 dias para cobrir a diferença entre UTC e o fuso local.
    const desde = menosDias(criterio.dia, 2);
    const linhas = await this.db
      .select({ dados: notificacoes.dados, criadoEm: notificacoes.criado_em })
      .from(notificacoes)
      .where(
        and(
          eq(notificacoes.destinatario_id, criterio.destinatarioId),
          eq(notificacoes.tipo, criterio.tipo),
          gte(notificacoes.criado_em, desde),
        ),
      );

    const dia = diaLocal(criterio.dia);
    return linhas.some((l) => {
      const conteudo = (l.dados as { conteudo?: Record<string, unknown> } | null)
        ?.conteudo;
      return (
        diaLocal(l.criadoEm) === dia &&
        conteudo?.etapa === criterio.etapaNome &&
        conteudo?.trabalho === criterio.trabalhoTitulo
      );
    });
  }
}
