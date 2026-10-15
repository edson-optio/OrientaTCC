import { Stack } from 'expo-router';

import { useSessaoDoPerfil } from '../../src/lib/sessao';
import { cores } from '../../src/tema/tokens';

/**
 * Perfil Orientador: as abas em (tabs) e, empilhadas por cima, as telas de
 * avaliacao de uma entrega, detalhe de proposta e detalhe do trabalho.
 */
export default function LayoutOrientador() {
  useSessaoDoPerfil('professor');
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="avaliacao/[etapaId]" />
      <Stack.Screen name="proposta/[id]" />
      <Stack.Screen name="trabalho/[id]" />
    </Stack>
  );
}
