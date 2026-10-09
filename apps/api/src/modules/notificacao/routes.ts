/**
 * Plugin Elysia do Componente Notificação.
 * Expõe INotificacao via HTTP sob o prefixo /notificacoes.
 */
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db, type Db } from "../../db";
import { usuarios } from "../../db/schema";
import { criarEmail } from "./email";
import {
  ErroAcessoNegado,
  ErroNaoEncontrado,
  ErroPreCondicao,
  TIPOS_NOTIFICACAO,
  type Destinatario,
  type INotificacao,
} from "./interface";
import { RepositorioDrizzle } from "./repositorio";
import { NotificacaoService } from "./service";
import { dadosExemplo } from "./templates";

const TAG = "Notificações";

/** Resolve o destinatário da rota de teste a partir do e-mail informado. */
export type ResolverDestinatario = (email: string) => Promise<Destinatario>;

/**
 * Localiza o usuário pelo e-mail em `usuarios`; se não existir, cria um
 * usuário de teste (perfil aluno) para que a FK de `notificacoes` seja
 * satisfeita. Uso restrito à rota de teste em desenvolvimento.
 */
export function resolverDestinatarioTeste(banco: Db): ResolverDestinatario {
  return async (email) => {
    const existente = await banco.query.usuarios.findFirst({
      where: eq(usuarios.email, email),
      columns: { id: true, nome: true, email: true },
    });
    if (existente) return existente;

    const [criado] = await banco
      .insert(usuarios)
      .values({ nome: "Usuário de Teste", email, perfil: "aluno" })
      .returning({ id: usuarios.id, nome: usuarios.nome, email: usuarios.email });
    return criado!;
  };
}

export function criarRotasNotificacao(
  servico: INotificacao,
  resolverDestinatario: ResolverDestinatario,
) {
  return new Elysia({ name: "modules/notificacao", prefix: "/notificacoes" })
    .error({ ErroPreCondicao, ErroNaoEncontrado, ErroAcessoNegado })
    .onError(({ code, error, set }) => {
      if (code === "ErroPreCondicao") {
        set.status = 400;
        return { erro: "pre_condicao", mensagem: error.message };
      }
      if (code === "ErroNaoEncontrado") {
        set.status = 404;
        return { erro: "nao_encontrado", mensagem: error.message };
      }
      if (code === "ErroAcessoNegado") {
        set.status = 403;
        return { erro: "acesso_negado", mensagem: error.message };
      }
    })
    .get(
      "",
      ({ query }) =>
        servico.listarPendentes({ destinatarioId: query.destinatarioId }),
      {
        query: t.Object({
          destinatarioId: t.Optional(
            t.Numeric({ description: "Filtra pelo id do usuário destinatário" }),
          ),
        }),
        detail: {
          tags: [TAG],
          summary: "Lista as notificações pendentes (ainda não lidas)",
        },
      },
    )
    .post(
      "/teste",
      async ({ body }) =>
        servico.notificar(
          await resolverDestinatario(body.email),
          body.tipo,
          dadosExemplo[body.tipo],
        ),
      {
        body: t.Object({
          email: t.String({ format: "email", description: "E-mail do destinatário" }),
          tipo: t.Union(
            TIPOS_NOTIFICACAO.map((tipo) => t.Literal(tipo)),
            { description: "Tipo da notificação de exemplo" },
          ),
        }),
        detail: {
          tags: [TAG],
          summary: "Dispara uma notificação de exemplo para o e-mail informado",
          description:
            "Usa dados fictícios do tipo escolhido. Se não houver usuário com esse e-mail, cria um usuário de teste. Sem RESEND_API_KEY o e-mail é apenas registrado no console.",
        },
      },
    )
    .patch(
      "/:id/lida",
      ({ params, body }) =>
        servico.marcarNotificacaoLida(params.id, body.usuarioId),
      {
        params: t.Object({ id: t.Numeric() }),
        // TODO(autenticacao): obter usuarioId da sessão (Better Auth) em vez do body.
        body: t.Object({
          usuarioId: t.Integer({
            minimum: 1,
            description: "Id do usuário que está lendo a notificação",
          }),
        }),
        detail: {
          tags: [TAG],
          summary: "Marca uma notificação como lida (UC06)",
        },
      },
    )
    .post("/reenviar", () => servico.reagendarEnvio(), {
      detail: {
        tags: [TAG],
        summary: "Reenvia os e-mails com envio falho (UC07 A1), até 3 tentativas",
      },
    });
}

/** Plugin pronto para uso na aplicação: Resend/Console + tabela `notificacoes`. */
export const notificacao = criarRotasNotificacao(
  new NotificacaoService(criarEmail(), new RepositorioDrizzle(db)),
  resolverDestinatarioTeste(db),
);
