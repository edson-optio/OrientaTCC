import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

/** Botao do cabecalho que abre a central de notificacoes. */
export function BotaoNotificacoes() {
  return (
    <Link href="/notificacoes" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notificacoes"
        hitSlop={8}
        style={({ pressed }) => [estilos.botao, pressed && estilos.pressionado]}
      >
        <Text style={estilos.icone}>🔔</Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  botao: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pressionado: {
    opacity: 0.5,
  },
  icone: {
    fontSize: 20,
  },
});
