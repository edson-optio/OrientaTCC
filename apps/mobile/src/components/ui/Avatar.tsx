import { StyleSheet, View } from 'react-native';

import { iniciais } from '../../lib/datas';
import { cores, fontes } from '../../tema/tokens';
import { Texto } from './Texto';

/** Pares suaves (fundo, texto) escolhidos de forma estavel pelo nome. */
const PALETA = [
  ['#E9E4F5', '#3B2A6B'],
  ['#E3F3EA', '#0F5A35'],
  ['#E8EEFC', '#1B3A8F'],
  ['#FBF0E1', '#7A3A06'],
  ['#F3E6EC', '#6B1F3F'],
] as const;

type Props = {
  nome: string;
  tamanho?: number;
  /** Avatar preto, usado para o proprio usuario. */
  escuro?: boolean;
};

export function Avatar({ nome, tamanho = 40, escuro }: Props) {
  const indice = [...nome].reduce((soma, c) => soma + c.charCodeAt(0), 0) % PALETA.length;
  const [fundo, texto] = escuro ? [cores.tinta, '#FFFFFF'] : PALETA[indice];
  return (
    <View
      accessibilityLabel={nome}
      style={[estilos.base, { width: tamanho, height: tamanho, backgroundColor: fundo }]}
    >
      <Texto style={[estilos.texto, { fontSize: tamanho * 0.36 }]} cor={texto}>
        {iniciais(nome)}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fontes.sansForte,
  },
});
