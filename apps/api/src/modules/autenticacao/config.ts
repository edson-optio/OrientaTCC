/**
 * Configuração do Better Auth (reuso definido no Lab 2) para o Componente
 * Autenticação. Cobre UC10 (cadastro com e-mail institucional e confirmação)
 * e UC11 (login com sessão).
 *
 * Este arquivo não importa `bun:sqlite` para que o CLI do Better Auth
 * (que roda em Node) consiga carregá-lo via `auth.cli.ts`. A instância real
 * fica em `auth.ts`.
 *
 * A tabela `usuarios` (Componente Cadastros) continua sendo a fonte do
 * domínio: cada `user` do Better Auth aponta para a sua linha em `usuarios`
 * via `user.usuario_id`, preenchida no hook `after` do cadastro.
 */
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { bearer } from "better-auth/plugins";

import type { Db } from "../../db";
import * as schema from "../../db/schema";
import { PERFIS_USUARIO } from "../../db/schema/cadastros";
import type { IEmail } from "../notificacao/interface";
import { emailVerificacao } from "./templates";

export interface OpcoesAuth {
  /** Banco Drizzle (real ou em memória nos testes). */
  db: Db;
  /** Interface requerida IEmail (Componente Notificação / Resend). */
  email: IEmail;
  /** Segredo para assinar cookies/tokens; padrão só para desenvolvimento. */
  secret?: string;
  /** URL pública da API, usada nos links de confirmação. */
  baseURL?: string;
}

/** Perfis que um usuário pode escolher ao se cadastrar (UC10 passo 2). */
export const PERFIS_CADASTRO = ["aluno", "professor"] as const;

/**
 * Verifica se o e-mail pertence ao domínio institucional configurado em
 * `parametros.dominio_email`. Sem parâmetro configurado, aceita qualquer
 * domínio (ambiente de desenvolvimento).
 */
export async function validarEmailInstitucional(
  db: Db,
  email: string,
): Promise<{ valido: boolean; dominio: string | null }> {
  const parametro = await db.query.parametros.findFirst({
    columns: { dominio_email: true },
  });
  const dominio = parametro?.dominio_email?.trim().toLowerCase() || null;
  if (!dominio) return { valido: true, dominio: null };
  const dominioEmail = email.trim().toLowerCase().split("@")[1] ?? "";
  return { valido: dominioEmail === dominio, dominio };
}

export function criarAuth(opcoes: OpcoesAuth) {
  const { db, email } = opcoes;

  return betterAuth({
    appName: "OrientaTCC",
    secret:
      opcoes.secret ??
      process.env.BETTER_AUTH_SECRET ??
      "orientatcc-segredo-de-desenvolvimento-troque-em-producao",
    baseURL:
      opcoes.baseURL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    basePath: "/api/auth",
    database: drizzleAdapter(db, { provider: "sqlite", schema }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const mensagem = emailVerificacao({ nome: user.name, url });
        await email.enviarEmail({ para: user.email, ...mensagem });
      },
    },

    user: {
      additionalFields: {
        perfil: {
          type: [...PERFIS_USUARIO],
          required: true,
          input: true,
        },
        cursoId: {
          type: "number",
          required: false,
          input: true,
          fieldName: "curso_id",
        },
        /** Ligação com a linha de domínio em `usuarios`; preenchida pelo sistema. */
        usuarioId: {
          type: "number",
          required: false,
          input: false,
          fieldName: "usuario_id",
        },
      },
    },

    databaseHooks: {
      user: {
        create: {
          // UC10 passo 3: valida o domínio institucional e o perfil escolhido.
          before: async (user) => {
            const perfil = (user as { perfil?: string }).perfil;
            if (!perfil || !(PERFIS_CADASTRO as readonly string[]).includes(perfil)) {
              throw new APIError("BAD_REQUEST", {
                message: "Perfil inválido: escolha aluno ou professor.",
              });
            }
            const { valido, dominio } = await validarEmailInstitucional(db, user.email);
            if (!valido) {
              throw new APIError("BAD_REQUEST", {
                message: `E-mail fora do domínio institucional (@${dominio}).`,
              });
            }
            return { data: { ...user, email: user.email.trim().toLowerCase() } };
          },
          // UC10 passo 4: cria (ou liga) o usuário de domínio em `usuarios`.
          after: async (user) => {
            const dados = user as typeof user & {
              perfil: (typeof PERFIS_USUARIO)[number];
              cursoId?: number | null;
            };

            let usuario = await db.query.usuarios.findFirst({
              where: eq(schema.usuarios.email, dados.email),
              columns: { id: true },
            });
            if (!usuario) {
              [usuario] = await db
                .insert(schema.usuarios)
                .values({
                  nome: dados.name,
                  email: dados.email,
                  perfil: dados.perfil,
                  curso_id: dados.cursoId ?? null,
                  ativo: true,
                })
                .returning({ id: schema.usuarios.id });
            }

            await db
              .update(schema.user)
              .set({ usuario_id: usuario!.id })
              .where(eq(schema.user.id, dados.id));
          },
        },
        update: {
          // UC10 passo 6: ao confirmar o e-mail, registra em `usuarios`.
          after: async (user) => {
            if (!user.emailVerified) return;
            await db
              .update(schema.usuarios)
              .set({ email_confirmado_em: new Date() })
              .where(eq(schema.usuarios.email, user.email));
          },
        },
      },
    },

    // Aceita `Authorization: Bearer <token>` além do cookie (útil para o app mobile).
    plugins: [bearer()],

    advanced: {
      database: { generateId: "uuid" },
    },
  });
}

export type Auth = ReturnType<typeof criarAuth>;
export type Sessao = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;
export type UsuarioSessao = Sessao["user"];
