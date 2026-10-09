import { Stack } from 'expo-router';

/**
 * Perfil Orientador: um Stack com as abas em (tabs) e a tela de detalhe do
 * trabalho (trabalho/[id]) fora das abas, aberta a partir do painel.
 */
export default function LayoutOrientador() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trabalho/[id]" options={{ title: 'Trabalho' }} />
    </Stack>
  );
}
