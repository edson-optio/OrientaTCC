/**
 * Testes de contrato de INotificacaoRepositorio: a mesma suíte roda contra
 * o RepositorioDrizzle (SQLite em memória com o schema real) e o
 * RepositorioMemoria, garantindo que ambos se comportem igual.
 */
import { afterAll, beforeEach, describe, expect, test } from "bun:test";

import { usuarios } from "../../db/schema";
import { criarBancoMemoria } from "./banco-teste";
import {
  RepositorioDrizzle,
  RepositorioMemoria,
  type INotificacaoRepositorio,
  type NovaNotificacao,
} from "./repositorio";
import { dadosExemplo } from "./templates";

const { db, sqlite } = await criarBancoMemoria();
afterAll(() => sqlite.close());

/** Ids dos usuários inseridos para satisfazer a FK `destinatario_id`. */
const JOAO = 1;
const MARIA = 2;

function nova(sobrescrever: Partial<NovaNotificacao> = {}): NovaNotificacao {
  return {
    destinatarioId: JOAO,
    destinatarioEmail: "joao@aluno.edu.br",
    tipo: "prazo_proximo",
    dados: dadosExemplo.prazo_proximo,
    assunto: "Prazo próximo: Entrega parcial 1 vence em 7 dias",
    html: "<p>corpo</p>",
    envio: "enviado",
    emailId: "email-1",
    erroEnvio: null,
    tentativasEnvio: 1,
    ...sobrescrever,
  };
}

const implementacoes: Array<{
  nome: string;
  criar: () => Promise<INotificacaoRepositorio>;
}> = [
  {
    nome: "RepositorioDrizzle (SQLite em memória)",
    criar: async () => {
      sqlite.exec("DELETE FROM notificacoes; DELETE FROM usuarios;");
      await db.insert(usuarios).values([
        { id: JOAO, nome: "João da Silva", email: "joao@aluno.edu.br", perfil: "aluno" },
        { id: MARIA, nome: "Maria Oliveira", email: "maria@aluno.edu.br", perfil: "aluno" },
      ]);
      return new RepositorioDrizzle(db);
    },
  },
  {
    nome: "RepositorioMemoria",
    criar: async () => new RepositorioMemoria(),
  },
];

describe.each(implementacoes)("$nome", ({ criar }) => {
  let repo: INotificacaoRepositorio;

  beforeEach(async () => {
    repo = await criar();
  });

  test("salvar devolve o registro com id, datas e dados tipados preservados", async () => {
    const salva = await repo.salvar(nova());

    expect(salva.id).toBeGreaterThan(0);
    expect(salva).toMatchObject({
      destinatarioId: JOAO,
      destinatarioEmail: "joao@aluno.edu.br",
      tipo: "prazo_proximo",
      dados: dadosExemplo.prazo_proximo,
      assunto: "Prazo próximo: Entrega parcial 1 vence em 7 dias",
      html: "<p>corpo</p>",
      envio: "enviado",
      emailId: "email-1",
      erroEnvio: null,
      tentativasEnvio: 1,
      lidaEm: null,
    });
    expect(salva.enviadaEm).not.toBeNull();
    expect(new Date(salva.criadaEm).getTime()).not.toBeNaN();

    expect(await repo.buscarPorId(salva.id)).toEqual(salva);
  });

  test("buscarPorId devolve null para id inexistente", async () => {
    expect(await repo.buscarPorId(12345)).toBeNull();
  });

  test("salvar com envio falho deixa enviadaEm nulo e guarda o erro", async () => {
    const salva = await repo.salvar(
      nova({ envio: "falhou", emailId: null, erroEnvio: "provedor indisponível" }),
    );

    expect(salva.envio).toBe("falhou");
    expect(salva.enviadaEm).toBeNull();
    expect(salva.emailId).toBeNull();
    expect(salva.erroEnvio).toBe("provedor indisponível");
  });

  test("listarPendentes ordena da mais recente para a mais antiga e filtra por destinatário", async () => {
    const a = await repo.salvar(nova());
    const b = await repo.salvar(nova({ tipo: "entrega_atrasada", dados: dadosExemplo.entrega_atrasada }));
    const c = await repo.salvar(
      nova({ destinatarioId: MARIA, destinatarioEmail: "maria@aluno.edu.br" }),
    );

    expect((await repo.listarPendentes()).map((n) => n.id)).toEqual([c.id, b.id, a.id]);
    expect(
      (await repo.listarPendentes({ destinatarioId: JOAO })).map((n) => n.id),
    ).toEqual([b.id, a.id]);
    expect(
      (await repo.listarPendentes({ destinatarioId: MARIA })).map((n) => n.id),
    ).toEqual([c.id]);
  });

  test("marcarLida do dono grava lidaEm, é idempotente e some das pendentes", async () => {
    const salva = await repo.salvar(nova());

    const lida = await repo.marcarLida(salva.id, JOAO);
    expect(lida?.lidaEm).not.toBeNull();
    expect(await repo.listarPendentes()).toHaveLength(0);

    const deNovo = await repo.marcarLida(salva.id, JOAO);
    expect(deNovo?.lidaEm).toBe(lida!.lidaEm);
  });

  test("marcarLida devolve null para outro usuário ou id inexistente", async () => {
    const salva = await repo.salvar(nova());

    expect(await repo.marcarLida(salva.id, MARIA)).toBeNull();
    expect(await repo.marcarLida(999, JOAO)).toBeNull();
    expect((await repo.buscarPorId(salva.id))!.lidaEm).toBeNull();
  });

  test("listarComEnvioFalho respeita o máximo de tentativas e ordena da mais antiga", async () => {
    const falha1 = await repo.salvar(
      nova({ envio: "falhou", emailId: null, erroEnvio: "erro", tentativasEnvio: 1 }),
    );
    const falha2 = await repo.salvar(
      nova({ envio: "falhou", emailId: null, erroEnvio: "erro", tentativasEnvio: 2 }),
    );
    await repo.salvar(
      nova({ envio: "falhou", emailId: null, erroEnvio: "erro", tentativasEnvio: 3 }),
    );
    await repo.salvar(nova());

    const pendentes = await repo.listarComEnvioFalho(3);
    expect(pendentes.map((n) => n.id)).toEqual([falha1.id, falha2.id]);
  });

  test("atualizarEnvio registra sucesso e falha de novas tentativas", async () => {
    const salva = await repo.salvar(
      nova({ envio: "falhou", emailId: null, erroEnvio: "erro 1", tentativasEnvio: 1 }),
    );

    const aindaFalha = await repo.atualizarEnvio(salva.id, {
      envio: "falhou",
      emailId: null,
      erroEnvio: "erro 2",
      tentativasEnvio: 2,
    });
    expect(aindaFalha).toMatchObject({
      envio: "falhou",
      erroEnvio: "erro 2",
      tentativasEnvio: 2,
      enviadaEm: null,
      dados: dadosExemplo.prazo_proximo,
    });

    const enviada = await repo.atualizarEnvio(salva.id, {
      envio: "enviado",
      emailId: "email-2",
      erroEnvio: null,
      tentativasEnvio: 3,
    });
    expect(enviada).toMatchObject({
      envio: "enviado",
      emailId: "email-2",
      erroEnvio: null,
      tentativasEnvio: 3,
    });
    expect(enviada.enviadaEm).not.toBeNull();
    expect(await repo.listarComEnvioFalho(3)).toHaveLength(0);
    expect(await repo.buscarPorId(salva.id)).toEqual(enviada);
  });

  test("atualizarEnvio de id inexistente lança erro", async () => {
    await expect(
      repo.atualizarEnvio(999, {
        envio: "enviado",
        emailId: "x",
        erroEnvio: null,
        tentativasEnvio: 2,
      }),
    ).rejects.toThrow(/não encontrada/);
  });
});
