/** Cronograma é o proprietário dos prazos e de sua interpretação temporal. */
export interface EtapaVigente {
  id: number;
  prazo: string;
  /** Verdadeiro somente após o dia do prazo no fuso America/Sao_Paulo. */
  prazoVencido: boolean;
  alunoId: number;
  orientadorId: number | null;
}
/** Recorte de consulta; não implementa a edição completa de cronogramas. */
export interface ICronograma {
  consultarEtapaVigente(trabalhoId: number, etapaId: number, referencia: Date): EtapaVigente;
}
