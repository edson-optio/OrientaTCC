/**
 * Cliente minimo de acesso a API (apps/api), com fetch tipado.
 *
 * A URL base vem de EXPO_PUBLIC_API_URL (ver .env.example). Em dispositivo
 * fisico, "localhost" aponta para o proprio celular: use o IP da maquina.
 */

const URL_PADRAO = 'http://localhost:3000';

/** Retorna a URL base da API, sem barra no final. */
export function apiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL ?? URL_PADRAO;
  return url.replace(/\/+$/, '');
}

/**
 * Erro lancado pelo cliente quando a API responde com status de erro ou
 * quando nao e possivel alcancar o servidor (status 0).
 */
export class ErroApi extends Error {
  /** Status HTTP da resposta; 0 quando a requisicao nem chegou ao servidor. */
  readonly status: number;
  /** Codigo de erro devolvido pela API (ex.: "nao_encontrado"), se houver. */
  readonly codigo: string | null;

  constructor(status: number, mensagem: string, codigo: string | null = null) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
  }
}

/** Formato dos erros de dominio da API ({ erro, mensagem }). */
type CorpoErroApi = { erro?: string; mensagem?: string; message?: string; summary?: string };

/** Extrai uma mensagem legivel do corpo de erro da API. */
async function mensagemDeErro(resposta: Response): Promise<{ mensagem: string; codigo: string | null }> {
  try {
    const corpo = (await resposta.json()) as CorpoErroApi;
    const mensagem = corpo.mensagem ?? corpo.summary ?? corpo.message ?? `HTTP ${resposta.status}`;
    return { mensagem, codigo: corpo.erro ?? null };
  } catch {
    return { mensagem: `HTTP ${resposta.status} ${resposta.statusText}`.trim(), codigo: null };
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${apiUrl()}${caminho}`, opcoes);
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro);
    throw new ErroApi(0, `Nao foi possivel conectar a API em ${apiUrl()} (${detalhe})`);
  }

  if (!resposta.ok) {
    const { mensagem, codigo } = await mensagemDeErro(resposta);
    throw new ErroApi(resposta.status, mensagem, codigo);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }
  return (await resposta.json()) as T;
}

/** Cliente HTTP tipado. O tipo T descreve o JSON esperado na resposta. */
export const api = {
  get<T>(caminho: string): Promise<T> {
    return requisitar<T>(caminho, { method: 'GET', headers: { accept: 'application/json' } });
  },

  patch<T>(caminho: string, body: unknown): Promise<T> {
    return requisitar<T>(caminho, {
      method: 'PATCH',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  },
};
