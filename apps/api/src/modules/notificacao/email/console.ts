/**
 * Implementação de IEmail para desenvolvimento: não envia nada, apenas
 * registra a mensagem no console.
 */
import type { IEmail, MensagemEmail } from "../interface";

export class ConsoleEmail implements IEmail {
  private contador = 0;

  async enviarEmail({ para, assunto, html }: MensagemEmail) {
    this.contador += 1;
    const id = `console-${this.contador}`;
    console.log(
      `[ConsoleEmail] id=${id} para=${para} assunto="${assunto}" html=${html.length} caracteres`,
    );
    return { id };
  }
}
