/**
 * Implementação de IEmail sobre o serviço externo Resend (reuso do Lab 2).
 * Lê RESEND_API_KEY e RESEND_FROM do ambiente, salvo se recebidos no construtor.
 */
import { Resend } from "resend";

import type { IEmail, MensagemEmail } from "../interface";

export const REMETENTE_PADRAO = "OrientaTCC <onboarding@resend.dev>";

export interface OpcoesResend {
  apiKey?: string;
  remetente?: string;
}

export class ResendEmail implements IEmail {
  private readonly cliente: Resend;
  private readonly remetente: string;

  constructor(opcoes: OpcoesResend = {}) {
    const apiKey = opcoes.apiKey ?? process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY não definida; configure a variável ou use ConsoleEmail.",
      );
    }
    this.remetente =
      opcoes.remetente ?? process.env.RESEND_FROM ?? REMETENTE_PADRAO;
    this.cliente = new Resend(apiKey);
  }

  async enviarEmail({ para, assunto, html }: MensagemEmail) {
    const { data, error } = await this.cliente.emails.send({
      from: this.remetente,
      to: [para],
      subject: assunto,
      html,
    });

    if (error || !data) {
      throw new Error(
        `Resend recusou o envio: ${error?.message ?? "resposta vazia"}`,
      );
    }

    return { id: data.id };
  }
}
