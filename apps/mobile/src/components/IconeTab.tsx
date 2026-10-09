import { type ColorValue, StyleSheet, Text } from 'react-native';

type Props = {
  /** Simbolo de texto usado como icone (o SDK 57 nao traz @expo/vector-icons). */
  simbolo: string;
  color: ColorValue;
};

/** Icone de aba feito so com texto, para evitar dependencias de UI. */
export function IconeTab({ simbolo, color }: Props) {
  return <Text style={[estilos.icone, { color }]}>{simbolo}</Text>;
}

const estilos = StyleSheet.create({
  icone: {
    fontSize: 20,
  },
});
