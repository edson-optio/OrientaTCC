/**
 * Testes do Monitor de Prazos sobre um SQLite em memória com o schema real,
 * usando os leitores Drizzle, o NotificacaoService real (com IEmail falso) e
 * a tabela `notificacoes` para a deduplicação.
 */
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import {
  cronogramas,
  entregas,
  etapas,
  feedbacks,
  notificacoes,
  propostas,
  trabalhos,
  usuarios,
  versoes,
} from "../../db/schema";
import { criarBancoMemoria } from "../notificacao/banco-teste";
import type { IEmail, MensagemEmail } from "../notificacao/interface";
import { RepositorioDrizzle } from "../notificacao/repositorio";
import { NotificacaoService } from "../notificacao/service";
import {
  CronogramaDrizzle,
  EntregaDrizzle,
  FeedbackDrizzle,
  HistoricoNotificacaoDrizzle,
} from "./consultas";
import { diaLocal, diasAte } from "./datas";
import { MonitorPrazosService } from "./service";

const { db, sqlite } = await criarBancoMemoria();
afterAll(() => sqlite.close());

class EmailFalso implements IEmail {
  enviados: MensagemEmail[] = [];
  async enviarEmail(mensagem: MensagemEmail) {
    this.enviados.push(mensagem);
    return { id: `falso-${this.enviados.length}` };
  }
}

/** "Agora" fixo: 17/09/2026 às 10:00 em São Paulo (13:00 UTC). */
const AGORA = new Date("2026-09-17T13:00:00.000Z");
const MS_DIA = 24 * 60 * 60 * 1000;
const emDias = (dias: number) => diaLocal(new Date(AGORA.getTime() + dias * MS_DIA));
const horasAtras = (horas: number) => new Date(AGORA.getTime() - horas * 60 * 60 * 1000);

const ALUNO = 1;
const ORIENTADOR = 2;
const TRABALHO = 1;

/** Limpa as tabelas e recria o cenário base: aluno, orientador, trabalho e cronograma publicado. */
async function seedBase() {
  sqlite.exec(
    "DELETE FROM notificacoes; DELETE FROM feedbacks; DELETE FROM versoes; DELETE FROM entregas; DELETE FROM etapas; DELETE FROM cronogramas; DELETE FROM trabalhos; DELETE FROM propostas; DELETE FROM usuarios; DELETE FROM sqlite_sequence;",
  );
  await db.insert(usuarios).values([
    { id: ALUNO, nome: "Carlos Lima", email: "carlos@exemplo.edu.br", perfil: "aluno" },
    { id: ORIENTADOR, nome: "Profa. Ana Souza", email: "ana@exemplo.edu.br", perfil: "professor" },
  ]);
  await db.insert(propostas).values({
    id: 1,
    aluno_id: ALUNO,
    professor_id: ORIENTADOR,
    tema: "App de TCC",
    resumo: "r",
    objetivos: "o",
    area_pesquisa: "ES",
    status: "aceita",
  });
  await db.insert(trabalhos).values({
    id: TRABALHO,
    proposta_id: 1,
    aluno_id: ALUNO,
    orientador_id: ORIENTADOR,
    titulo: "App de TCC",
    status: "em_orientacao",
  });
  await db.insert(cronogramas).values({
    id: 1,
    trabalho_id: TRABALHO,
    criado_por_id: ORIENTADOR,
    publicado_em: horasAtras(24 * 30),
  });
}

async function criarEtapa(id: number, nome: string, prazo: string, cronogramaId = 1) {
  await db.insert(etapas).values({ id, cronograma_id: cronogramaId, nome, prazo, ordem: id });
}

function criarMonitor() {
  const email = new EmailFalso();
  const monitor = new MonitorPrazosService({
    cronograma: new CronogramaDrizzle(db),
    entregas: new EntregaDrizzle(db),
    feedbacks: new FeedbackDrizzle(db),
    notificacao: new NotificacaoService(email, new RepositorioDrizzle(db)),
    historico: new HistoricoNotificacaoDrizzle(db),
  });
  return { email, monitor };
}

async function notificacoesGravadas() {
  return db
    .select({
      destinatario: notificacoes.destinatario_id,
      tipo: notificacoes.tipo,
      dados: notificacoes.dados,
    })
    .from(notificacoes)
    .orderBy(notificacoes.id);
}

describe("datas", () => {
  test("diasAte conta dias-calendário no fuso de São Paulo", () => {
    expect(diaLocal(AGORA)).toBe("2026-09-17");
    expect(diasAte("2026-09-24", AGORA)).toBe(7);
    expect(diasAte("2026-09-19", AGORA)).toBe(2);
    expect(diasAte("2026-09-17", AGORA)).toBe(0);
    expect(diasAte("2026-09-10", AGORA)).toBe(-7);
    // 01:00 UTC ainda é o dia anterior em São Paulo.
    expect(diaLocal(new Date("2026-09-18T01:00:00.000Z"))).toBe("2026-09-17");
  });
});

describe("MonitorPrazosService.verificarPrazos", () => {
  beforeEach(seedBase);

  test("etapa sem entrega com prazo em 7 dias gera prazo_proximo ao aluno", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(7));
    const { email, monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo).toMatchObject({
      prazosProximos: 1,
      atrasos: 0,
      feedbacksNaoLidos: 0,
      notificacoesGeradas: 1,
    });
    expect(email.enviados).toHaveLength(1);
    expect(email.enviados[0]).toMatchObject({
      para: "carlos@exemplo.edu.br",
      assunto: "Prazo próximo: Revisão bibliográfica vence em 7 dias",
    });
    expect(await notificacoesGravadas()).toEqual([
      expect.objectContaining({ destinatario: ALUNO, tipo: "prazo_proximo" }),
    ]);
  });

  test("etapa sem entrega com prazo em 2 dias gera prazo_proximo; em 5 dias não", async () => {
    await criarEtapa(1, "Protótipo", emDias(2));
    await criarEtapa(2, "Monografia", emDias(5));
    const { email, monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo.prazosProximos).toBe(1);
    expect(resumo.notificacoesGeradas).toBe(1);
    expect(email.enviados[0]!.assunto).toBe("Prazo próximo: Protótipo vence em 2 dias");
  });

  test("etapa já entregue não gera alerta de prazo", async () => {
    await criarEtapa(1, "Protótipo", emDias(2));
    await db.insert(entregas).values({ trabalho_id: TRABALHO, etapa_id: 1, status: "entregue" });
    const { monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo.prazosProximos).toBe(0);
    expect(resumo.notificacoesGeradas).toBe(0);
  });

  test("etapa vencida sem entrega vira atrasada e notifica aluno e orientador", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(-7));
    const { email, monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo).toMatchObject({ atrasos: 1, prazosProximos: 0, notificacoesGeradas: 2 });

    const entrega = await db.query.entregas.findFirst({
      where: eq(entregas.etapa_id, 1),
    });
    expect(entrega?.status).toBe("atrasada");

    expect(email.enviados.map((e) => e.para).sort()).toEqual([
      "ana@exemplo.edu.br",
      "carlos@exemplo.edu.br",
    ]);
    expect(email.enviados[0]!.assunto).toBe("Entrega atrasada: Revisão bibliográfica");
    expect(email.enviados[0]!.html).toContain("7 dia(s)");
  });

  test("entrega pendente já registrada é atualizada para atrasada", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(-1));
    const [pendente] = await db
      .insert(entregas)
      .values({ trabalho_id: TRABALHO, etapa_id: 1, status: "pendente" })
      .returning();
    const { monitor } = criarMonitor();

    await monitor.verificarPrazos(AGORA);

    const atualizada = await db.query.entregas.findFirst({
      where: eq(entregas.id, pendente!.id),
    });
    expect(atualizada?.status).toBe("atrasada");
    expect(await db.select().from(entregas)).toHaveLength(1);
  });

  test("etapa vencida mas entregue (em revisão) não é atraso", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(-7));
    await db.insert(entregas).values({ trabalho_id: TRABALHO, etapa_id: 1, status: "em_revisao" });
    const { monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo.atrasos).toBe(0);
    expect(resumo.notificacoesGeradas).toBe(0);
  });

  test("feedback não lido há mais de 2 dias gera feedback_disponivel; recente não", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(30));
    await criarEtapa(2, "Protótipo", emDias(60));
    const [entregaAntiga] = await db
      .insert(entregas)
      .values({ trabalho_id: TRABALHO, etapa_id: 1, status: "em_revisao" })
      .returning();
    const [entregaRecente] = await db
      .insert(entregas)
      .values({ trabalho_id: TRABALHO, etapa_id: 2, status: "em_revisao" })
      .returning();
    const [versaoAntiga] = await db
      .insert(versoes)
      .values({ entrega_id: entregaAntiga!.id, numero: 1, arquivo: "a.pdf" })
      .returning();
    const [versaoRecente] = await db
      .insert(versoes)
      .values({ entrega_id: entregaRecente!.id, numero: 1, arquivo: "b.pdf" })
      .returning();
    await db.insert(feedbacks).values([
      {
        versao_id: versaoAntiga!.id,
        autor_id: ORIENTADOR,
        parecer: "revisar",
        criado_em: horasAtras(72),
        atualizado_em: horasAtras(72),
      },
      {
        versao_id: versaoRecente!.id,
        autor_id: ORIENTADOR,
        parecer: "aprovado",
        criado_em: horasAtras(12),
        atualizado_em: horasAtras(12),
      },
    ]);
    const { email, monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo).toMatchObject({ feedbacksNaoLidos: 1, notificacoesGeradas: 1 });
    expect(email.enviados[0]).toMatchObject({
      para: "carlos@exemplo.edu.br",
      assunto: "Novo feedback em Revisão bibliográfica (versão 1)",
    });
    expect(email.enviados[0]!.html).toContain("Profa. Ana Souza");
  });

  test("feedback já lido não gera notificação", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(30));
    const [entrega] = await db
      .insert(entregas)
      .values({ trabalho_id: TRABALHO, etapa_id: 1, status: "aprovada" })
      .returning();
    const [versao] = await db
      .insert(versoes)
      .values({ entrega_id: entrega!.id, numero: 1, arquivo: "a.pdf" })
      .returning();
    await db.insert(feedbacks).values({
      versao_id: versao!.id,
      autor_id: ORIENTADOR,
      parecer: "aprovado",
      lido_em: horasAtras(48),
      criado_em: horasAtras(96),
      atualizado_em: horasAtras(96),
    });
    const { monitor } = criarMonitor();

    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo.feedbacksNaoLidos).toBe(0);
    expect(resumo.notificacoesGeradas).toBe(0);
  });

  test("é idempotente no mesmo dia: a segunda execução não duplica notificações", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(-7));
    await criarEtapa(2, "Protótipo", emDias(2));
    const { email, monitor } = criarMonitor();

    const primeira = await monitor.verificarPrazos(AGORA);
    const segunda = await monitor.verificarPrazos(
      new Date(AGORA.getTime() + 3 * 60 * 60 * 1000),
    );

    expect(primeira).toMatchObject({ atrasos: 1, prazosProximos: 1, notificacoesGeradas: 3 });
    // As situações continuam detectadas, mas nada novo é gerado.
    expect(segunda).toMatchObject({ atrasos: 1, prazosProximos: 1, notificacoesGeradas: 0 });
    expect(email.enviados).toHaveLength(3);
    expect(await notificacoesGravadas()).toHaveLength(3);
  });

  test("no dia seguinte o atraso volta a ser notificado", async () => {
    await criarEtapa(1, "Revisão bibliográfica", emDias(-7));
    const { email, monitor } = criarMonitor();

    await monitor.verificarPrazos(AGORA);
    const amanha = await monitor.verificarPrazos(new Date(AGORA.getTime() + MS_DIA));

    expect(amanha.notificacoesGeradas).toBe(2);
    expect(email.enviados).toHaveLength(4);
  });

  test("ignora cronograma não publicado e trabalho concluído", async () => {
    // Cronograma 1 (publicado) do trabalho 1 fica sem etapas; cria outro não publicado.
    await db.insert(propostas).values({
      id: 2,
      aluno_id: ALUNO,
      professor_id: ORIENTADOR,
      tema: "Outro",
      resumo: "r",
      objetivos: "o",
      area_pesquisa: "ES",
      status: "aceita",
    });
    await db.insert(trabalhos).values({
      id: 2,
      proposta_id: 2,
      aluno_id: ALUNO,
      orientador_id: ORIENTADOR,
      titulo: "Outro trabalho",
      status: "em_orientacao",
    });
    await db.insert(cronogramas).values({ id: 2, trabalho_id: 2, publicado_em: null });
    await criarEtapa(1, "Rascunho", emDias(-3), 2);

    await db.update(trabalhos).set({ status: "concluido" }).where(eq(trabalhos.id, TRABALHO));
    await criarEtapa(2, "Etapa de trabalho concluído", emDias(-3), 1);

    const { monitor } = criarMonitor();
    const resumo = await monitor.verificarPrazos(AGORA);

    expect(resumo).toMatchObject({ atrasos: 0, prazosProximos: 0, notificacoesGeradas: 0 });
  });
});
