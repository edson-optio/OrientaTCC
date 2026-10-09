import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SessaoProvider } from '../src/lib/sessao';

/**
 * Layout raiz: um Stack com a tela de entrada, um grupo por perfil e a central
 * de notificacoes (fora dos grupos, aberta pelo cabecalho das abas).
 * Os grupos (aluno, orientador e admin) escondem o cabecalho do Stack porque
 * cada um tem o seu proprio navegador.
 */
export default function LayoutRaiz() {
  return (
    <SessaoProvider>
      <Stack screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="index" options={{ title: 'OrientaTCC' }} />
        <Stack.Screen name="(aluno)" options={{ headerShown: false }} />
        <Stack.Screen name="(orientador)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="notificacoes" options={{ title: 'Notificacoes' }} />
      </Stack>
      <StatusBar style="auto" />
    </SessaoProvider>
  );
}
