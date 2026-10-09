/**
 * Implementação do Componente Notificação (INotificacao).
 * Recebe as dependências por injeção: IEmail (interface requerida, Resend) e
 * INotificacaoRepositorio (tabela `notificacoes`).
 */
import {
  ErroAcessoNegado,
  ErroNaoEncontrado,
  ErroPreCondicao,
  MAX_TENTATIVAS_ENVIO,
  TIPOS_NOTIFICACAO,
  type DadosNotificacao,
  type Destinatario,
  type FiltroNotificacao,
  type IEmail,
  type INotificacao,
  type MensagemEmail,
  type Notificacao,
  type ResultadoReagendamento,
  type TipoNotificacao,
} from "./interface";
import type { AtualizacaoEnvio, INotificacaoRepositorio } from "./repositorio";
import { gerarConteudo } from "./templates";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class NotificacaoService implements INotificacao {
  constructor(
    private readonly email: IEmail,
    private readonly repositorio: INotificacaoRepositorio,
  ) {}

  async notificar<T extends TipoNotificacao>(
    destinatario: Destinatario,
    tipo: T,
    dados: DadosNotificacao[T],
  ): Promise<Notificacao<T>> {
    this.validarPreCondicoes(destinatario, tipo, dados);

    const { assunto, html } = gerarConteudo(tipo, destinatario.nome, dados);
    const resultado = await this.tentarEnviar(
      { para: destinatario.email, assunto, html },
      1,
    );

    const salva = await this.repositorio.salvar({
      destinatarioId: destinatario.id,
      destinatarioEmail: destinatario.email,
      tipo,
      dados,
      assunto,
      html,
      ...resultado,
    });
    return salva as Notificacao<T>;
  }

  async listarPendentes(filtro: FiltroNotificacao = {}): Promise<Notificacao[]> {
    return this.repositorio.listarPendentes(filtro);
  }

  async marcarNotificacaoLida(
    notificacaoId: number,
    usuarioId: number,
  ): Promise<Notificacao> {
    const lida = await this.repositorio.marcarLida(notificacaoId, usuarioId);
    if (lida) return lida;

    const existente = await this.repositorio.buscarPorId(notificacaoId);
    if (!existente) {
      throw new ErroNaoEncontrado(`Notificação ${notificacaoId} não encontrada.`);
    }
    throw new ErroAcessoNegado(
      `A notificação ${notificacaoId} não pertence ao usuário ${usuarioId}.`,
    );
  }

  async reagendarEnvio(): Promise<ResultadoReagendamento> {
    const pendentes = await this.repositorio.listarComEnvioFalho(
      MAX_TENTATIVAS_ENVIO,
    );
    const resumo: ResultadoReagendamento = {
      processadas: pendentes.length,
      reenviadas: 0,
      falhas: 0,
    };

    for (const notificacao of pendentes) {
      const resultado = await this.tentarEnviar(
        {
          para: notificacao.destinatarioEmail,
          assunto: notificacao.assunto,
          html: notificacao.html,
        },
        notificacao.tentativasEnvio + 1,
      );
      await this.repositorio.atualizarEnvio(notificacao.id, resultado);
      if (resultado.envio === "enviado") resumo.reenviadas += 1;
      else resumo.falhas += 1;
    }

    return resumo;
  }

  /**
   * Pede o envio a IEmail sem propagar exceção: uma falha do provedor mantém
   * a notificação interna e fica registrada para reagendamento (UC07 A1).
   */
  private async tentarEnviar(
    mensagem: MensagemEmail,
    tentativa: number,
  ): Promise<AtualizacaoEnvio> {
    try {
      const { id } = await this.email.enviarEmail(mensagem);
      return {
        envio: "enviado",
        emailId: id,
        erroEnvio: null,
        tentativasEnvio: tentativa,
      };
    } catch (erro) {
      return {
        envio: "falhou",
        emailId: null,
        erroEnvio: erro instanceof Error ? erro.message : String(erro),
        tentativasEnvio: tentativa,
      };
    }
  }

  private validarPreCondicoes(
    destinatario: Destinatario,
    tipo: TipoNotificacao,
    dados: unknown,
  ): void {
    if (
      !destinatario ||
      !Number.isInteger(destinatario.id) ||
      destinatario.id <= 0
    ) {
      throw new ErroPreCondicao("Destinatário sem identificador válido.");
    }
    const email = destinatario.email?.trim() ?? "";
    if (!email) {
      throw new ErroPreCondicao("Destinatário sem e-mail.");
    }
    if (!REGEX_EMAIL.test(email)) {
      throw new ErroPreCondicao(`E-mail do destinatário inválido: "${email}".`);
    }
    if (!TIPOS_NOTIFICACAO.includes(tipo)) {
      throw new ErroPreCondicao(`Tipo de notificação desconhecido: "${tipo}".`);
    }
    if (!dados || typeof dados !== "object") {
      throw new ErroPreCondicao("Dados da notificação ausentes.");
    }
  }
}
