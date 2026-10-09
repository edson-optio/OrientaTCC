/**
 * Plugin Elysia do Componente Autenticação.
 * - Monta o handler do Better Auth em /api/auth/* (sign-up, sign-in,
 *   verify-email, sign-out, get-session etc.).
 * - Expõe GET /auth/eu com a sessão atual e o perfil do usuário.
 */
import { Elysia } from "elysia";

import { auth as authPadrao, type Auth } from "./auth";
import { AutenticacaoService, exigirPerfil } from "./service";
import type { IAutenticacao } from "./interface";

const TAG = "Autenticação";

export function criarRotasAutenticacao(auth: Auth, servico: IAutenticacao) {
  return new Elysia({ name: "modules/autenticacao" })
    .all(
      "/api/auth/*",
      ({ request }) => auth.handler(request),
      {
        parse: "none",
        detail: {
          tags: [TAG],
          summary: "Endpoints do Better Auth (sign-up, sign-in, verify-email, sign-out)",
          description:
            "Cadastro: POST /api/auth/sign-up/email {name, email, password, perfil, cursoId}. " +
            "Login: POST /api/auth/sign-in/email {email, password}. " +
            "Sessão: GET /api/auth/get-session. Sair: POST /api/auth/sign-out.",
        },
      },
    )
    .get(
      "/auth/eu",
      async ({ request, status }) => {
        const sessao = await servico.obterSessao(request.headers);
        if (!sessao) {
          return status(401, {
            erro: "nao_autenticado",
            mensagem: "Nenhuma sessão ativa.",
          });
        }
        return {
          usuario: sessao.usuario,
          sessao: { expiraEm: sessao.expiraEm.toISOString() },
        };
      },
      {
        detail: {
          tags: [TAG],
          summary: "Sessão atual: usuário autenticado e seu perfil (UC11 passo 3)",
        },
      },
    );
}

/** Serviço padrão (Better Auth com o banco real). */
export const autenticacaoService = new AutenticacaoService(authPadrao);

/** Guard pronto para as demais rotas da API: `app.use(exigirPerfilPadrao(["professor"]))`. */
export const exigirPerfilPadrao = (
  perfis: Parameters<typeof exigirPerfil>[1],
) => exigirPerfil(autenticacaoService, perfis);

export const autenticacao = criarRotasAutenticacao(authPadrao, autenticacaoService);
