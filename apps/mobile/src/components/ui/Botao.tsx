import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { cores, fontes, raio } from '../../tema/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'fantasma';

type Props = {
  rotulo: string;
  aoPressionar?: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  compacto?: boolean;
  desabilitado?: boolean;
  carregando?: boolean;
  estilo?: StyleProp<ViewStyle>;
};

/** Botao em pilula. Altura minima de 46pt, acima do alvo de toque de 44pt. */
export function Botao({
  rotulo,
  aoPressionar,
  variante = 'primario',
  icone,
  compacto,
  desabilitado,
  carregando,
  estilo,
}: Props) {
  const corTexto = variante === 'primario' ? '#FFFFFF' : cores.tinta;
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      disabled={inativo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.base,
        compacto && estilos.compacto,
        estilos[variante],
        pressed && estilos.pressionado,
        inativo && estilos.desabilitado,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={estilos.conteudo}>
          {icone && <Icone nome={icone} tamanho={compacto ? 16 : 18} cor={corTexto} />}
          <Texto style={[estilos.rotulo, compacto && estilos.rotuloCompacto]} cor={corTexto}>
            {rotulo}
          </Texto>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: raio.total,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compacto: {
    minHeight: 44,
    paddingHorizontal: 16,
  },
  primario: {
    backgroundColor: cores.tinta,
  },
  secundario: {
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  fantasma: {
    backgroundColor: cores.superficie,
  },
  pressionado: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  desabilitado: {
    opacity: 0.4,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rotulo: {
    fontFamily: fontes.sansForte,
    fontSize: 16,
    lineHeight: 20,
  },
  rotuloCompacto: {
    fontSize: 15,
  },
});
