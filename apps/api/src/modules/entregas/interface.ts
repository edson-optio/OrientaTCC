/** UC04/UC05: contratos públicos independentes do transporte HTTP. */
export type Ator = { id: number; perfil: 'aluno' | 'professor' | 'admin' };
export { ErroDominio } from '../compartilhado/erro-dominio';
/** Porta pertencente ao componente Cronograma e requerida por Entregas. */
export type { ICronograma, EtapaVigente } from '../cronograma/interface';
export interface Versao {
  id: number; entregaId: number; trabalhoId: number; etapaId: number;
  numero: number; arquivo: string; nome: string | null; alunoId: number;
  orientadorId: number | null; status: string;
}
export interface IEntrega {
  submeterEntrega(ator: Ator, trabalhoId: number, etapaId: number, arquivo: { nome: string; conteudoBase64: string }): Versao;
  listarVersoes(ator: Ator, trabalhoId: number, etapaId: number): Versao[];
  consultarVersao(ator: Ator, versaoId: number): Versao;
  listarEntregasPendentes(ator: Ator): Versao[];
  /** Extensão do Lab 3: Entregas altera o estado a pedido de Feedback sem acessar tabelas de Entregas. */
  atualizarSituacao(ator: Ator, versaoId: number, parecer: 'aprovado' | 'revisar'): void;
}
