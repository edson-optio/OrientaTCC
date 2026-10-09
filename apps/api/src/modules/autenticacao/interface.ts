/**
 * Componente Autenticação — interface fornecida (IAutenticacao), conforme a
 * "Especificação e Modelagem de Componentes - OrientaTCC" (abordagem de
 * Cheesman & Daniels).
 *
 * Responsabilidade: criar e confirmar contas, autenticar usuários, manter
 * sessões e verificar permissões por perfil (UC10, UC11). A implementação
 * reutiliza o Better Auth (reuso definido no Lab 2); as interfaces
 * requeridas são IUsuario (tabela `usuarios`, Componente Cadastros) e
 * INotificacao/IEmail (envio do e-mail de confirmação).
 */
import type { PerfilUsuario } from "../../db/schema/cadastros";

export type { PerfilUsuario };

/** Dados informados pelo usuário ao criar a conta (UC10 passo 2). */
export interface DadosCadastro {
  nome: string;
  /** E-mail institucional; o domínio é validado contra `parametros.dominio_email`. */
  email: string;
  senha: string;
  /** Apenas "aluno" ou "professor" podem se autocadastrar; "admin" vem do seed/administração. */
  perfil: Extract<PerfilUsuario, "aluno" | "professor">;
  cursoId?: number | null;
}

/** Usuário autenticado, como visto pelas demais camadas da API. */
export interface UsuarioAutenticado {
  /** Id da conta no Better Auth (texto/UUID). */
  id: string;
  /** Id da linha correspondente em `usuarios` (domínio); nulo só em estados transitórios. */
  usuarioId: number | null;
  nome: string;
  email: string;
  emailConfirmado: boolean;
  perfil: PerfilUsuario;
  cursoId: number | null;
}

/** Sessão ativa (UC11 passo 2). */
export interface SessaoAtiva {
  /** Token da sessão (também enviado como cookie). */
  token: string;
  expiraEm: Date;
  usuario: UsuarioAutenticado;
}

/** Cabeçalhos da requisição HTTP, de onde o cookie/bearer da sessão é lido. */
export type CabecalhosRequisicao = Headers;

/**
 * Interface fornecida IAutenticacao.
 *
 * Operação `cadastrar(dados)` (UC10)
 * - Pré-condições: `nome`, `email` e `senha` (mínimo 8 caracteres) informados;
 *   `perfil` é "aluno" ou "professor"; o e-mail não está cadastrado; o domínio
 *   do e-mail é o institucional configurado em `parametros.dominio_email`.
 * - Pós-condições: a conta é criada no Better Auth com e-mail não confirmado;
 *   a linha correspondente é criada em `usuarios` (nome, email, perfil,
 *   curso_id, ativo = true) e ligada por `user.usuario_id`; um e-mail de
 *   confirmação é enviado via IEmail.
 * - Resultado: o usuário criado (ainda sem sessão, pois a conta está inativa
 *   até a confirmação).
 * - Violações (A1 e-mail duplicado, A2 domínio inválido): rejeita com
 *   `ErroAutenticacao` de código "email_duplicado" ou "dominio_invalido".
 *
 * Operação `autenticar(email, senha)` (UC11)
 * - Pré-condições: conta existente com e-mail confirmado.
 * - Pós-condições: uma sessão é criada.
 * - Resultado: a sessão com o usuário, seu perfil e permissões implícitas.
 * - Violações: credenciais inválidas rejeitam com "credenciais_invalidas";
 *   e-mail não confirmado rejeita com "email_nao_confirmado" (UC10 A3) e
 *   reenvia o e-mail de confirmação.
 *
 * Operação `obterSessao(cabecalhos)` (UC11 passo 3)
 * - Pré-condições: nenhuma.
 * - Pós-condições: nenhum estado é alterado (a sessão pode ser renovada).
 * - Resultado: a sessão ativa, ou `null` quando ausente/expirada (UC11 A2).
 *
 * Operação `encerrarSessao(cabecalhos)`
 * - Pré-condições: nenhuma.
 * - Pós-condições: a sessão indicada pelo cookie/bearer deixa de ser válida.
 *
 * Operação `verificarPermissao(usuario, perfis)`
 * - Pré-condições: nenhuma.
 * - Resultado: `true` quando o perfil do usuário está em `perfis`.
 */
export interface IAutenticacao {
  cadastrar(dados: DadosCadastro): Promise<UsuarioAutenticado>;
  autenticar(email: string, senha: string): Promise<SessaoAtiva>;
  obterSessao(cabecalhos: CabecalhosRequisicao): Promise<SessaoAtiva | null>;
  encerrarSessao(cabecalhos: CabecalhosRequisicao): Promise<void>;
  verificarPermissao(
    usuario: UsuarioAutenticado,
    perfis: readonly PerfilUsuario[],
  ): boolean;
}

export type CodigoErroAutenticacao =
  | "dominio_invalido"
  | "email_duplicado"
  | "credenciais_invalidas"
  | "email_nao_confirmado"
  | "dados_invalidos";

/** Erro lançado quando uma pré-condição de IAutenticacao é violada. */
export class ErroAutenticacao extends Error {
  constructor(
    public readonly codigo: CodigoErroAutenticacao,
    mensagem: string,
    public readonly status: number = 400,
  ) {
    super(mensagem);
    this.name = "ErroAutenticacao";
  }
}
