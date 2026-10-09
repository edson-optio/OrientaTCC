/**
 * Templates de e-mail do Componente Autenticação (UC10 passo 5).
 */

function escapar(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function emailVerificacao(dados: { nome: string; url: string }) {
  return {
    assunto: "Confirme seu e-mail no OrientaTCC",
    html: `
      <p>Olá, <strong>${escapar(dados.nome)}</strong>!</p>
      <p>Para ativar sua conta no OrientaTCC, confirme seu e-mail institucional
      clicando no link abaixo:</p>
      <p><a href="${escapar(dados.url)}">Confirmar e-mail</a></p>
      <p>Se você não criou uma conta, ignore esta mensagem.</p>
    `.trim(),
  };
}
