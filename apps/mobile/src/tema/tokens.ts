/**
 * Tokens do design system do OrientaTCC (mood "marca-texto": folha branca,
 * tinta preta e um unico grifo amarelo). Espelham os tokens do arquivo
 * "OrientaTCC — App Design" no Paper.
 *
 * Regra de uso da cor: o amarelo `grifo` nunca e cor de texto; ele aparece
 * atras de texto escuro para marcar "o que importa agora". As cores de
 * status sao as "canetas" do orientador e sempre acompanham icone e rotulo.
 */
export const cores = {
  fundo: '#FFFFFF',
  superficie: '#F4F4F2',
  linha: '#E4E4E0',
  linhaForte: '#C9C9C4',
  suave: '#5E5E5E',
  apagado: '#7A7A7A',
  tinta: '#121212',
  grifo: '#EEFF3A',

  revisao: '#1D4ED8',
  revisaoFundo: '#E8EEFC',
  aprovada: '#0F7A45',
  aprovadaFundo: '#E3F3EA',
  revisar: '#B45309',
  revisarFundo: '#FBF0E1',
  atrasada: '#C4321F',
  atrasadaFundo: '#FBE9E6',
} as const;

export const espaco = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
} as const;

export const raio = {
  sm: 6,
  md: 14,
  lg: 20,
  total: 999,
} as const;

/** Nomes registrados em useFonts (ver src/tema/fontes.ts). */
export const fontes = {
  display: 'Fraunces_600SemiBold',
  displayItalico: 'Fraunces_400Regular_Italic',
  displayLeve: 'Fraunces_400Regular',
  sans: 'InterTight_400Regular',
  sansMedio: 'InterTight_500Medium',
  sansForte: 'InterTight_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
  monoForte: 'IBMPlexMono_600SemiBold',
} as const;

/** Margem lateral padrao das telas. */
export const MARGEM_TELA = espaco[5];

/** Espaco reservado no fim das telas com abas para a barra flutuante. */
export const ESPACO_BARRA_ABAS = 120;
