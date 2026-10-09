/**
 * Implementação de IAutenticacao: fachada fina sobre o Better Auth.
 * Também expõe `exigirPerfil(perfis)`, um plugin Elysia que protege rotas por
 * perfil (verificarPermissao aplicado como guard).
 */
import { APIError } from "better-auth/api";
import { Elysia } from "elysia";

import type { Auth, UsuarioSessao } from "./auth";
import {
  ErroAutenticacao,
  type DadosCadastro,
  type IAutenticacao,
  type PerfilUsuario,
  type SessaoAtiva,
  type UsuarioAutenticado,
} from "./interface";

/** Converte o usuário do Better Auth no formato da interface fornecida. */
export function paraUsuarioAutenticado(user: UsuarioSessao): UsuarioAutenticado {
  return {
    id: user.id,
    usuarioId: user.usuarioId ?? null,
    nome: user.name,
    email: user.email,
    emailConfirmado: user.emailVerified,
    perfil: user.perfil as PerfilUsuario,
    cursoId: user.cursoId ?? null,
  };
}

/** Traduz os erros do Better Auth para `ErroAutenticacao`. */
function traduzirErro(erro: unknown): never {
  if (erro instanceof APIError) {
    const mensagem = erro.body?.message ?? erro.message;
    const codigo = String(erro.body?.code ?? "");
    if (codigo === "USER_ALREADY_EXISTS" || codigo === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      throw new ErroAutenticacao(
        "email_duplicado",
        "E-mail já cadastrado. Se a conta é sua, recupere a senha.",
        409,
      );
    }
    if (codigo === "EMAIL_NOT_VERIFIED") {
      throw new ErroAutenticacao(
        "email_nao_confirmado",
        "Confirme seu e-mail antes de entrar. Reenviamos o link de confirmação.",
        403,
      );
    }
    if (codigo === "INVALID_EMAIL_OR_PASSWORD" || codigo === "INVALID_PASSWORD") {
      throw new ErroAutenticacao(
        "credenciais_invalidas",
        "E-mail ou senha inválidos.",
        401,
      );
    }
    if (mensagem.includes("domínio institucional")) {
      throw new ErroAutenticacao("dominio_invalido", mensagem, 400);
    }
    throw new ErroAutenticacao("dados_invalidos", mensagem, erro.statusCode);
  }
  throw erro;
}

export class AutenticacaoService implements IAutenticacao {
  constructor(private readonly auth: Auth) {}

  async cadastrar(dados: DadosCadastro): Promise<UsuarioAutenticado> {
    // UC10 A1: o Better Auth, com verificação de e-mail obrigatória, responde
    // ao e-mail duplicado com sucesso genérico (anti-enumeração). O contrato
    // pede rejeição explícita, então verificamos antes.
    const contexto = await this.auth.$context;
    const existente = await contexto.internalAdapter.findUserByEmail(
      dados.email.trim().toLowerCase(),
    );
    if (existente) {
      throw new ErroAutenticacao(
        "email_duplicado",
        "E-mail já cadastrado. Se a conta é sua, recupere a senha.",
        409,
      );
    }
    try {
      const resultado = await this.auth.api.signUpEmail({
        body: {
          name: dados.nome,
          email: dados.email,
          password: dados.senha,
          perfil: dados.perfil,
          cursoId: dados.cursoId ?? undefined,
        },
      });
      // O hook `after` preenche usuario_id depois da criação; relemos o usuário.
      const sessao = await this.auth.api.getSession({
        headers: new Headers({ authorization: `Bearer ${resultado.token ?? ""}` }),
      });
      return paraUsuarioAutenticado(
        (sessao?.user as UsuarioSessao | undefined) ??
          (resultado.user as unknown as UsuarioSessao),
      );
    } catch (erro) {
      traduzirErro(erro);
    }
  }

  async autenticar(email: string, senha: string): Promise<SessaoAtiva> {
    try {
      const resultado = await this.auth.api.signInEmail({
        body: { email, password: senha },
      });
      const sessao = await this.auth.api.getSession({
        headers: new Headers({ authorization: `Bearer ${resultado.token}` }),
      });
      if (!sessao) {
        throw new ErroAutenticacao(
          "credenciais_invalidas",
          "Não foi possível criar a sessão.",
          401,
        );
      }
      return {
        token: resultado.token,
        expiraEm: sessao.session.expiresAt,
        usuario: paraUsuarioAutenticado(sessao.user as UsuarioSessao),
      };
    } catch (erro) {
      traduzirErro(erro);
    }
  }

  async obterSessao(cabecalhos: Headers): Promise<SessaoAtiva | null> {
    const sessao = await this.auth.api.getSession({ headers: cabecalhos });
    if (!sessao) return null;
    return {
      token: sessao.session.token,
      expiraEm: sessao.session.expiresAt,
      usuario: paraUsuarioAutenticado(sessao.user as UsuarioSessao),
    };
  }

  async encerrarSessao(cabecalhos: Headers): Promise<void> {
    try {
      await this.auth.api.signOut({ headers: cabecalhos });
    } catch (erro) {
      // Sem sessão ativa não há o que encerrar.
      if (!(erro instanceof APIError)) throw erro;
    }
  }

  verificarPermissao(
    usuario: UsuarioAutenticado,
    perfis: readonly PerfilUsuario[],
  ): boolean {
    return perfis.includes(usuario.perfil);
  }
}

/**
 * Guard do Elysia: exige sessão ativa com um dos perfis informados e injeta
 * `usuario` (UsuarioAutenticado) e `sessao` no contexto das rotas.
 *
 * Uso: `app.use(exigirPerfil(servico, ["professor"])).get("/painel", ({ usuario }) => ...)`
 * Responde 401 sem sessão e 403 com perfil não autorizado.
 */
export function exigirPerfil(
  servico: IAutenticacao,
  perfis: readonly PerfilUsuario[],
) {
  return new Elysia({ name: `autenticacao/exigirPerfil/${perfis.join(",")}` })
    .resolve({ as: "scoped" }, async ({ request, status }) => {
      const sessao = await servico.obterSessao(request.headers);
      if (!sessao) {
        return status(401, {
          erro: "nao_autenticado",
          mensagem: "Faça login para acessar este recurso.",
        });
      }
      if (!servico.verificarPermissao(sessao.usuario, perfis)) {
        return status(403, {
          erro: "perfil_nao_autorizado",
          mensagem: `Acesso restrito aos perfis: ${perfis.join(", ")}.`,
        });
      }
      return { usuario: sessao.usuario, sessao };
    });
}
