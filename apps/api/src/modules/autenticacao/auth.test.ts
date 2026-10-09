/**
 * Testes do Componente Autenticação (UC10 e UC11) sobre um SQLite em
 * memória com o schema real (inclusive as tabelas do Better Auth).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { schema } from "../../db";
import { criarBancoMemoria } from "../notificacao/banco-teste";
import type { IEmail, MensagemEmail } from "../notificacao/interface";
import { criarAuth, validarEmailInstitucional } from "./config";
import { ErroAutenticacao } from "./interface";
import { AutenticacaoService, exigirPerfil } from "./service";

/** IEmail falso: guarda as mensagens para inspecionar o link de confirmação. */
class EmailFalso implements IEmail {
  enviados: MensagemEmail[] = [];
  async enviarEmail(mensagem: MensagemEmail) {
    this.enviados.push(mensagem);
    return { id: `falso-${this.enviados.length}` };
  }
}

const { db, sqlite } = await criarBancoMemoria();
const email = new EmailFalso();
const auth = criarAuth({
  db,
  email,
  secret: "segredo-de-teste-com-pelo-menos-32-caracteres",
  baseURL: "http://localhost:3902",
});
const servico = new AutenticacaoService(auth);

beforeAll(async () => {
  await db.insert(schema.parametros).values({
    limite_orientandos: 5,
    dominio_email: "exemplo.edu.br",
  });
  await db.insert(schema.cursos).values({ nome: "Ciência da Computação", sigla: "CC" });
});
afterAll(() => sqlite.close());

/** Extrai o token do link de confirmação enviado por e-mail. */
function tokenDoUltimoEmail(): string {
  const ultimo = email.enviados.at(-1);
  const url = ultimo?.html.match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
  const token = url ? new URL(url).searchParams.get("token") : null;
  if (!token) throw new Error("e-mail de confirmação sem token");
  return token;
}

describe("validarEmailInstitucional", () => {
  test("aceita o domínio configurado e rejeita os demais", async () => {
    expect(await validarEmailInstitucional(db, "a@exemplo.edu.br")).toEqual({
      valido: true,
      dominio: "exemplo.edu.br",
    });
    expect(await validarEmailInstitucional(db, "a@gmail.com")).toEqual({
      valido: false,
      dominio: "exemplo.edu.br",
    });
  });
});

describe("UC10 cadastrar", () => {
  test("rejeita e-mail fora do domínio institucional (A2)", async () => {
    const promessa = servico.cadastrar({
      nome: "Fulano",
      email: "fulano@gmail.com",
      senha: "senha123",
      perfil: "aluno",
    });
    await expect(promessa).rejects.toBeInstanceOf(ErroAutenticacao);
    await expect(promessa).rejects.toMatchObject({ codigo: "dominio_invalido" });

    const contas = await db.query.user.findMany();
    expect(contas).toHaveLength(0);
  });

  test("cadastro válido cria user, usuarios ligados e envia e-mail de confirmação", async () => {
    const usuario = await servico.cadastrar({
      nome: "Carlos Lima",
      email: "carlos.lima@exemplo.edu.br",
      senha: "senha123",
      perfil: "aluno",
      cursoId: 1,
    });

    expect(usuario.perfil).toBe("aluno");
    expect(usuario.emailConfirmado).toBe(false);

    const conta = await db.query.user.findFirst({
      where: eq(schema.user.email, "carlos.lima@exemplo.edu.br"),
    });
    const dominio = await db.query.usuarios.findFirst({
      where: eq(schema.usuarios.email, "carlos.lima@exemplo.edu.br"),
    });
    expect(conta).toBeDefined();
    expect(dominio).toMatchObject({
      nome: "Carlos Lima",
      perfil: "aluno",
      curso_id: 1,
      ativo: true,
    });
    expect(conta!.usuario_id).toBe(dominio!.id);

    expect(email.enviados).toHaveLength(1);
    expect(email.enviados[0]!.para).toBe("carlos.lima@exemplo.edu.br");
    expect(email.enviados[0]!.assunto).toContain("Confirme seu e-mail");
  });

  test("rejeita e-mail já cadastrado (A1)", async () => {
    const promessa = servico.cadastrar({
      nome: "Outro",
      email: "carlos.lima@exemplo.edu.br",
      senha: "senha123",
      perfil: "aluno",
    });
    await expect(promessa).rejects.toMatchObject({ codigo: "email_duplicado" });
  });

  test("rejeita perfil admin no autocadastro", async () => {
    const promessa = servico.cadastrar({
      nome: "Intruso",
      email: "intruso@exemplo.edu.br",
      senha: "senha123",
      // força um perfil não permitido no cadastro
      perfil: "admin" as "aluno",
    });
    await expect(promessa).rejects.toMatchObject({ codigo: "dados_invalidos" });
  });
});

describe("UC11 autenticar", () => {
  test("login antes de confirmar o e-mail é rejeitado (UC10 A3)", async () => {
    const promessa = servico.autenticar("carlos.lima@exemplo.edu.br", "senha123");
    await expect(promessa).rejects.toMatchObject({ codigo: "email_nao_confirmado" });
  });

  test("confirmar o e-mail ativa a conta e registra em usuarios", async () => {
    const token = tokenDoUltimoEmail();
    await auth.api.verifyEmail({ query: { token } });

    const conta = await db.query.user.findFirst({
      where: eq(schema.user.email, "carlos.lima@exemplo.edu.br"),
    });
    const dominio = await db.query.usuarios.findFirst({
      where: eq(schema.usuarios.email, "carlos.lima@exemplo.edu.br"),
    });
    expect(conta!.emailVerified).toBe(true);
    expect(dominio!.email_confirmado_em).toBeInstanceOf(Date);
  });

  test("login com senha errada falha (A1)", async () => {
    const promessa = servico.autenticar("carlos.lima@exemplo.edu.br", "errada123");
    await expect(promessa).rejects.toBeInstanceOf(ErroAutenticacao);
    await expect(promessa).rejects.toMatchObject({
      codigo: "credenciais_invalidas",
      status: 401,
    });
  });

  test("login válido devolve sessão com perfil e usuarioId", async () => {
    const sessao = await servico.autenticar("carlos.lima@exemplo.edu.br", "senha123");

    expect(sessao.token).toBeString();
    expect(sessao.expiraEm.getTime()).toBeGreaterThan(Date.now());
    expect(sessao.usuario).toMatchObject({
      nome: "Carlos Lima",
      email: "carlos.lima@exemplo.edu.br",
      perfil: "aluno",
      emailConfirmado: true,
      cursoId: 1,
    });
    expect(sessao.usuario.usuarioId).toBeNumber();

    // obterSessao a partir do token (bearer) e verificarPermissao
    const cabecalhos = new Headers({ authorization: `Bearer ${sessao.token}` });
    const atual = await servico.obterSessao(cabecalhos);
    expect(atual?.usuario.perfil).toBe("aluno");
    expect(servico.verificarPermissao(atual!.usuario, ["aluno", "professor"])).toBe(true);
    expect(servico.verificarPermissao(atual!.usuario, ["professor"])).toBe(false);

    await servico.encerrarSessao(cabecalhos);
    expect(await servico.obterSessao(cabecalhos)).toBeNull();
  });

  test("sem sessão, obterSessao devolve null (A2)", async () => {
    expect(await servico.obterSessao(new Headers())).toBeNull();
  });
});

describe("exigirPerfil (guard do Elysia)", () => {
  const app = new Elysia()
    .get("/publica", () => "ok")
    .group("/professor", (g) =>
      g.use(exigirPerfil(servico, ["professor"])).get("/painel", ({ usuario }) => usuario.nome),
    )
    .group("/aluno", (g) =>
      g.use(exigirPerfil(servico, ["aluno"])).get("/meu", ({ usuario }) => usuario.nome),
    );

  test("sem sessão responde 401 e não afeta rotas públicas", async () => {
    expect((await app.handle(new Request("http://localhost/publica"))).status).toBe(200);
    const resposta = await app.handle(new Request("http://localhost/aluno/meu"));
    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toMatchObject({ erro: "nao_autenticado" });
  });

  test("perfil errado responde 403 e perfil certo recebe o usuário no contexto", async () => {
    const sessao = await servico.autenticar("carlos.lima@exemplo.edu.br", "senha123");
    const cabecalhos = { authorization: `Bearer ${sessao.token}` };

    const negado = await app.handle(
      new Request("http://localhost/professor/painel", { headers: cabecalhos }),
    );
    expect(negado.status).toBe(403);
    expect(await negado.json()).toMatchObject({ erro: "perfil_nao_autorizado" });

    const permitido = await app.handle(
      new Request("http://localhost/aluno/meu", { headers: cabecalhos }),
    );
    expect(permitido.status).toBe(200);
    expect(await permitido.text()).toBe("Carlos Lima");
  });
});
