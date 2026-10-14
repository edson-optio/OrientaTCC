import { Stack } from 'expo-router';

import { cores } from '../../src/tema/tokens';

/**
 * Perfil Aluno: as abas em (tabs) e o detalhe da entrega de uma etapa
 * (entrega/[etapaId]) empilhado por cima, fora das abas.
 */
export default function LayoutAluno() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="entrega/[etapaId]" />
    </Stack>
  );
}
