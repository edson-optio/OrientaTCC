import { describe, expect, test } from "bun:test";

import {
  ErroAcessoNegado,
  ErroNaoEncontrado,
  ErroPreCondicao,
  TIPOS_NOTIFICACAO,
  type Destinatario,
  type IEmail,
  type MensagemEmail,
  type TipoNotificacao,
} from "./interface";
import { RepositorioMemoria } from "./repositorio";
import { NotificacaoService } from "./service";
import { dadosExemplo } from "./templates";

/** IEmail falso: guarda as mensagens e pode simular falha do provedor. */
class EmailFalso implements IEmail {
  enviados: MensagemEmail[] = [];
  falhar = false;

  async enviarEmail(mensagem: MensagemEmail) {
    if (this.falhar) throw new Error("provedor indisponível");
    this.enviados.push(mensagem);
    return { id: `falso-${this.enviados.length}` };
  }
}

function criarServico() {
  const email = new EmailFalso();
  const repositorio = new RepositorioMemoria();
  return { email, repositorio, servico: new NotificacaoService(email, repositorio) };
}

const destinatario: Destinatario = {
  id: 1,
  nome: "João da Silva",
  email: "joao@aluno.edu.br",
};

const outroDestinatario: Destinatario = {
  id: 2,
  nome: "Maria Oliveira",
  email: "maria@aluno.edu.br",
};

const assuntoEsperado: Record<TipoNotificacao, string> = {
  prazo_proximo: "Prazo próximo: Entrega parcial 1 vence em 7 dias",
  entrega_atrasada: "Entrega atrasada: Entrega parcial 1",
  feedback_disponivel: "Novo feedback em Entrega parcial 1 (versão 2)",
  proposta_status: 'Proposta "Gestão de TCC com aplicativos móveis": aceita',
  convite_orientacao: "Nova proposta de orientação: João da Silva",
  convite_banca: "Convite para banca: Gestão de TCC com aplicativos móveis",
};

describe("NotificacaoService", () => {
  describe("gera o assunto correto para cada tipo", () => {
    for (const tipo of TIPOS_NOTIFICACAO) {
      test(tipo, async () => {
        const { email, servico } = criarServico();

        const notificacao = await servico.notificar(
          destinatario,
          tipo,
          dadosExemplo[tipo],
        );

        expect(notificacao.tipo).toBe(tipo);
        expect(notificacao.assunto).toBe(assuntoEsperado[tipo]);
        expect(email.enviados).toHaveLength(1);
        expect(email.enviados[0]).toMatchObject({
          para: destinatario.email,
          assunto: assuntoEsperado[tipo],
        });
        expect(email.enviados[0]!.html).toContain("João da Silva");
        expect(email.enviados[0]!.html).toContain("<!doctype html>");
      });
    }
  });

  test("registra a notificação como pendente com o id do e-mail", async () => {
    const { servico } = criarServico();

    const criada = await servico.notificar(
      destinatario,
      "prazo_proximo",
      dadosExemplo.prazo_proximo,
    );
    const pendentes = await servico.listarPendentes();

    expect(pendentes).toHaveLength(1);
    expect(pendentes[0]).toMatchObject({
      id: criada.id,
      destinatarioId: 1,
      tipo: "prazo_proximo",
      envio: "enviado",
      emailId: "falso-1",
      tentativasEnvio: 1,
      lidaEm: null,
    });
    expect(pendentes[0]!.enviadaEm).not.toBeNull();
  });

  test("lista as pendentes da mais recente para a mais antiga e filtra por destinatário", async () => {
    const { servico } = criarServico();

    const primeira = await servico.notificar(
      destinatario,
      "prazo_proximo",
      dadosExemplo.prazo_proximo,
    );
    await Bun.sleep(2);
    const segunda = await servico.notificar(
      destinatario,
      "entrega_atrasada",
      dadosExemplo.entrega_atrasada,
    );
    const deOutro = await servico.notificar(
      outroDestinatario,
      "feedback_disponivel",
      dadosExemplo.feedback_disponivel,
    );

    const todas = (await servico.listarPendentes()).map((n) => n.id);
    expect(todas).toEqual([deOutro.id, segunda.id, primeira.id]);

    const soDoJoao = await servico.listarPendentes({ destinatarioId: 1 });
    expect(soDoJoao.map((n) => n.id)).toEqual([segunda.id, primeira.id]);
  });

  test("mantém a notificação quando o serviço de e-mail falha (UC07 A1)", async () => {
    const { email, servico } = criarServico();
    email.falhar = true;

    const notificacao = await servico.notificar(
      destinatario,
      "feedback_disponivel",
      dadosExemplo.feedback_disponivel,
    );

    expect(notificacao.envio).toBe("falhou");
    expect(notificacao.erroEnvio).toBe("provedor indisponível");
    expect(notificacao.emailId).toBeNull();
    expect(notificacao.enviadaEm).toBeNull();
    expect(notificacao.tentativasEnvio).toBe(1);
    expect(await servico.listarPendentes()).toHaveLength(1);
  });

  describe("marcarNotificacaoLida", () => {
    test("marca como lida e remove das pendentes", async () => {
      const { servico } = criarServico();
      const criada = await servico.notificar(
        destinatario,
        "prazo_proximo",
        dadosExemplo.prazo_proximo,
      );

      const lida = await servico.marcarNotificacaoLida(criada.id, destinatario.id);

      expect(lida.id).toBe(criada.id);
      expect(lida.lidaEm).not.toBeNull();
      expect(await servico.listarPendentes()).toHaveLength(0);
    });

    test("é idempotente: preserva a data da primeira leitura", async () => {
      const { servico } = criarServico();
      const criada = await servico.notificar(
        destinatario,
        "prazo_proximo",
        dadosExemplo.prazo_proximo,
      );

      const primeira = await servico.marcarNotificacaoLida(criada.id, 1);
      await Bun.sleep(2);
      const segunda = await servico.marcarNotificacaoLida(criada.id, 1);

      expect(segunda.lidaEm).toBe(primeira.lidaEm);
    });

    test("rejeita notificação inexistente", async () => {
      const { servico } = criarServico();

      await expect(servico.marcarNotificacaoLida(999, 1)).rejects.toBeInstanceOf(
        ErroNaoEncontrado,
      );
    });

    test("rejeita notificação de outro usuário", async () => {
      const { servico } = criarServico();
      const criada = await servico.notificar(
        destinatario,
        "prazo_proximo",
        dadosExemplo.prazo_proximo,
      );

      await expect(
        servico.marcarNotificacaoLida(criada.id, outroDestinatario.id),
      ).rejects.toBeInstanceOf(ErroAcessoNegado);
      expect((await servico.listarPendentes())[0]!.lidaEm).toBeNull();
    });
  });

  describe("reagendarEnvio", () => {
    test("reenvia as falhas quando o provedor volta e ignora as já enviadas", async () => {
      const { email, servico } = criarServico();
      const ok = await servico.notificar(
        destinatario,
        "prazo_proximo",
        dadosExemplo.prazo_proximo,
      );
      email.falhar = true;
      const falha = await servico.notificar(
        destinatario,
        "entrega_atrasada",
        dadosExemplo.entrega_atrasada,
      );
      expect(falha.envio).toBe("falhou");

      email.falhar = false;
      const resumo = await servico.reagendarEnvio();

      expect(resumo).toEqual({ processadas: 1, reenviadas: 1, falhas: 0 });
      expect(email.enviados).toHaveLength(2);
      expect(email.enviados[1]!.assunto).toBe(falha.assunto);

      const pendentes = await servico.listarPendentes();
      const reenviada = pendentes.find((n) => n.id === falha.id)!;
      expect(reenviada).toMatchObject({
        envio: "enviado",
        emailId: "falso-2",
        erroEnvio: null,
        tentativasEnvio: 2,
      });
      expect(pendentes.find((n) => n.id === ok.id)!.tentativasEnvio).toBe(1);
    });

    test("desiste após 3 tentativas", async () => {
      const { email, servico } = criarServico();
      email.falhar = true;
      const falha = await servico.notificar(
        destinatario,
        "convite_orientacao",
        dadosExemplo.convite_orientacao,
      );

      expect(await servico.reagendarEnvio()).toEqual({
        processadas: 1,
        reenviadas: 0,
        falhas: 1,
      });
      expect(await servico.reagendarEnvio()).toEqual({
        processadas: 1,
        reenviadas: 0,
        falhas: 1,
      });
      // Já atingiu 3 tentativas: não é mais processada.
      expect(await servico.reagendarEnvio()).toEqual({
        processadas: 0,
        reenviadas: 0,
        falhas: 0,
      });

      const [registro] = await servico.listarPendentes();
      expect(registro!.id).toBe(falha.id);
      expect(registro!.tentativasEnvio).toBe(3);
      expect(registro!.envio).toBe("falhou");
    });
  });

  describe("rejeita pré-condições violadas", () => {
    test("e-mail vazio", async () => {
      const { email, servico } = criarServico();

      await expect(
        servico.notificar(
          { ...destinatario, email: "" },
          "prazo_proximo",
          dadosExemplo.prazo_proximo,
        ),
      ).rejects.toBeInstanceOf(ErroPreCondicao);

      expect(email.enviados).toHaveLength(0);
      expect(await servico.listarPendentes()).toHaveLength(0);
    });

    test("e-mail com formato inválido", async () => {
      const { servico } = criarServico();

      await expect(
        servico.notificar(
          { ...destinatario, email: "sem-arroba" },
          "prazo_proximo",
          dadosExemplo.prazo_proximo,
        ),
      ).rejects.toThrow(/inválido/);
    });

    test("destinatário sem id válido", async () => {
      const { servico } = criarServico();

      await expect(
        servico.notificar(
          { ...destinatario, id: 0 },
          "prazo_proximo",
          dadosExemplo.prazo_proximo,
        ),
      ).rejects.toBeInstanceOf(ErroPreCondicao);
    });

    test("tipo desconhecido", async () => {
      const { servico } = criarServico();

      await expect(
        servico.notificar(
          destinatario,
          "inexistente" as TipoNotificacao,
          dadosExemplo.prazo_proximo,
        ),
      ).rejects.toBeInstanceOf(ErroPreCondicao);
    });
  });
});
