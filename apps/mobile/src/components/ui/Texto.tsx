import { StyleSheet, Text, type TextProps } from 'react-native';

import { cores, fontes } from '../../tema/tokens';

/**
 * Escala tipografica:
 * - display / titulo / subtitulo: Fraunces, titulos editoriais
 * - citacao: Fraunces italico, usado no texto do parecer
 * - corpo / corpoForte / legenda: Inter Tight, interface
 * - rotulo: IBM Plex Mono em caixa-alta, datas e sobretitulos
 */
export type VarianteTexto =
  | 'display'
  | 'titulo'
  | 'subtitulo'
  | 'citacao'
  | 'corpoGrande'
  | 'corpo'
  | 'corpoForte'
  | 'legenda'
  | 'rotulo';

type Props = TextProps & {
  variante?: VarianteTexto;
  cor?: string;
};

export function Texto({ variante = 'corpo', cor, style, ...resto }: Props) {
  return <Text {...resto} style={[estilos[variante], cor ? { color: cor } : null, style]} />;
}

const estilos = StyleSheet.create({
  display: {
    fontFamily: fontes.display,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
    color: cores.tinta,
  },
  titulo: {
    fontFamily: fontes.display,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
    color: cores.tinta,
  },
  subtitulo: {
    fontFamily: fontes.display,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: cores.tinta,
  },
  citacao: {
    fontFamily: fontes.displayItalico,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: cores.tinta,
  },
  corpoGrande: {
    fontFamily: fontes.sansForte,
    fontSize: 17,
    lineHeight: 22,
    color: cores.tinta,
  },
  corpo: {
    fontFamily: fontes.sans,
    fontSize: 15,
    lineHeight: 22,
    color: cores.tinta,
  },
  corpoForte: {
    fontFamily: fontes.sansForte,
    fontSize: 16,
    lineHeight: 21,
    color: cores.tinta,
  },
  legenda: {
    fontFamily: fontes.sans,
    fontSize: 13,
    lineHeight: 18,
    color: cores.suave,
  },
  rotulo: {
    fontFamily: fontes.mono,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: cores.suave,
  },
});
