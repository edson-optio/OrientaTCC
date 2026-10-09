/**
 * Templates de e-mail do Componente Notificação, um por tipo, em português.
 * Cada template recebe o nome do destinatário e os dados tipados do tipo e
 * devolve o assunto e o corpo HTML da mensagem.
 */
import type {
  DadosNotificacao,
  TipoNotificacao,
} from "./interface";

export interface ConteudoEmail {
  assunto: string;
  html: string;
}

type Template<T extends TipoNotificacao> = (
  nome: string,
  dados: DadosNotificacao[T],
) => ConteudoEmail;

/** Escapa caracteres especiais para inserir texto em HTML com segurança. */
function escapar(texto: string | number): string {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Formata uma data ISO 8601 no padrão brasileiro (dd/mm/aaaa). */
function formatarData(iso: string, comHora = false): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return escapar(iso);
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    ...(comHora ? { timeStyle: "short" } : {}),
  });
}

/** Envolve o conteúdo no layout padrão dos e-mails do OrientaTCC. */
function layout(titulo: string, nome: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #1d4ed8;">${escapar(titulo)}</h1>
      <p>Olá, ${escapar(nome)}.</p>
      ${corpo}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280;">
        Mensagem automática do OrientaTCC. Não responda a este e-mail.
      </p>
    </div>
  </body>
</html>`;
}

const ROTULO_STATUS_PROPOSTA: Record<
  DadosNotificacao["proposta_status"]["status"],
  string
> = {
  aguardando_orientador: "aguardando resposta do orientador",
  aceita: "aceita",
  devolvida: "devolvida para ajustes",
  recusada: "recusada",
};

export const templates: { [T in TipoNotificacao]: Template<T> } = {
  prazo_proximo: (nome, dados) => {
    const dias = dados.diasRestantes;
    const quando =
      dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
    return {
      assunto: `Prazo próximo: ${dados.etapa} vence ${quando}`,
      html: layout(
        "Prazo de entrega se aproximando",
        nome,
        `<p>A etapa <strong>${escapar(dados.etapa)}</strong> do trabalho
        <strong>${escapar(dados.trabalho)}</strong> vence ${quando}
        (${formatarData(dados.prazo)}).</p>
        <p>Acesse o OrientaTCC para submeter a sua entrega.</p>`,
      ),
    };
  },

  entrega_atrasada: (nome, dados) => ({
    assunto: `Entrega atrasada: ${dados.etapa}`,
    html: layout(
      "Entrega em atraso",
      nome,
      `<p>A etapa <strong>${escapar(dados.etapa)}</strong> do trabalho
      <strong>${escapar(dados.trabalho)}</strong> venceu em
      ${formatarData(dados.prazo)} e está há
      <strong>${escapar(dados.diasAtraso)} dia(s)</strong> em atraso.</p>
      <p>A entrega ainda pode ser feita, mas será marcada como
      "Entregue com atraso".</p>`,
    ),
  }),

  feedback_disponivel: (nome, dados) => ({
    assunto: `Novo feedback em ${dados.etapa} (versão ${dados.versao})`,
    html: layout(
      "Feedback disponível",
      nome,
      `<p>O orientador <strong>${escapar(dados.orientador)}</strong> registrou
      um parecer para a versão <strong>${escapar(dados.versao)}</strong> da etapa
      <strong>${escapar(dados.etapa)}</strong> do trabalho
      <strong>${escapar(dados.trabalho)}</strong>.</p>
      <p>Parecer: <strong>${dados.parecer === "aprovado" ? "Aprovado" : "Revisar"}</strong>.</p>
      <p>Acesse o OrientaTCC para ler os comentários.</p>`,
    ),
  }),

  proposta_status: (nome, dados) => {
    const rotulo = ROTULO_STATUS_PROPOSTA[dados.status];
    return {
      assunto: `Proposta "${dados.tema}": ${rotulo}`,
      html: layout(
        "Atualização da proposta de tema",
        nome,
        `<p>A proposta <strong>${escapar(dados.tema)}</strong> foi
        <strong>${escapar(rotulo)}</strong> pelo professor
        <strong>${escapar(dados.professor)}</strong>.</p>
        ${
          dados.justificativa
            ? `<p>Justificativa: ${escapar(dados.justificativa)}</p>`
            : ""
        }
        <p>Acesse o OrientaTCC para acompanhar a proposta.</p>`,
      ),
    };
  },

  convite_orientacao: (nome, dados) => ({
    assunto: `Nova proposta de orientação: ${dados.aluno}`,
    html: layout(
      "Convite para orientação",
      nome,
      `<p>O aluno <strong>${escapar(dados.aluno)}</strong> submeteu a proposta
      <strong>${escapar(dados.tema)}</strong> e escolheu você como orientador.</p>
      <p>Resumo: ${escapar(dados.resumo)}</p>
      <p>Acesse o OrientaTCC para aceitar, devolver ou recusar a proposta.</p>`,
    ),
  }),

  convite_banca: (nome, dados) => ({
    assunto: `Convite para banca: ${dados.trabalho}`,
    html: layout(
      "Convite para compor a banca",
      nome,
      `<p>Você foi convidado(a) para a banca do trabalho
      <strong>${escapar(dados.trabalho)}</strong>, do aluno
      <strong>${escapar(dados.aluno)}</strong>, orientado por
      <strong>${escapar(dados.orientador)}</strong>.</p>
      <p>Defesa: <strong>${formatarData(dados.data, true)}</strong>,
      em ${escapar(dados.local)}.</p>
      <p>Acesse o OrientaTCC para confirmar a sua participação.</p>`,
    ),
  }),
};

/** Gera assunto e HTML para um tipo de notificação a partir dos dados tipados. */
export function gerarConteudo<T extends TipoNotificacao>(
  tipo: T,
  nome: string,
  dados: DadosNotificacao[T],
): ConteudoEmail {
  return templates[tipo](nome, dados);
}

/** Dados de exemplo por tipo, usados pela rota de teste e pelos testes. */
export const dadosExemplo: { [T in TipoNotificacao]: DadosNotificacao[T] } = {
  prazo_proximo: {
    trabalho: "Gestão de TCC com aplicativos móveis",
    etapa: "Entrega parcial 1",
    prazo: "2026-10-01",
    diasRestantes: 7,
  },
  entrega_atrasada: {
    trabalho: "Gestão de TCC com aplicativos móveis",
    etapa: "Entrega parcial 1",
    prazo: "2026-09-10",
    diasAtraso: 7,
  },
  feedback_disponivel: {
    trabalho: "Gestão de TCC com aplicativos móveis",
    etapa: "Entrega parcial 1",
    versao: 2,
    parecer: "revisar",
    orientador: "Profa. Ana Souza",
  },
  proposta_status: {
    tema: "Gestão de TCC com aplicativos móveis",
    status: "aceita",
    professor: "Profa. Ana Souza",
  },
  convite_orientacao: {
    aluno: "João da Silva",
    tema: "Gestão de TCC com aplicativos móveis",
    resumo: "Aplicativo para acompanhamento de entregas e prazos de TCC.",
  },
  convite_banca: {
    trabalho: "Gestão de TCC com aplicativos móveis",
    aluno: "João da Silva",
    orientador: "Profa. Ana Souza",
    data: "2026-12-10T14:00:00-03:00",
    local: "Sala 204, Bloco B",
  },
};
