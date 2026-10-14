import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoProvider } from '../src/lib/demo';
import { SessaoProvider } from '../src/lib/sessao';
import { FONTES } from '../src/tema/fontes';
import { cores } from '../src/tema/tokens';

/**
 * Layout raiz: carrega as fontes do design system, prove sessao e o store de
 * demonstracao, e empilha a entrada, um grupo por perfil e a central de
 * notificacoes. Os cabecalhos sao desenhados pelas proprias telas.
 */
export default function LayoutRaiz() {
  const [fontesProntas] = useFonts(FONTES);

  if (!fontesProntas) {
    return <View style={{ flex: 1, backgroundColor: cores.fundo }} />;
  }

  return (
    <SafeAreaProvider>
      <SessaoProvider>
        <DemoProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(aluno)" />
            <Stack.Screen name="(orientador)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="notificacoes" />
          </Stack>
          <StatusBar style="dark" />
        </DemoProvider>
      </SessaoProvider>
    </SafeAreaProvider>
  );
}
