import { Tabs } from 'expo-router/js-tabs';

import { BarraAbas } from '../../../src/components/ui/BarraAbas';
import { useDemo } from '../../../src/lib/demo';

/** Abas do perfil Aluno (UC01, UC04 e UC06). */
export default function AbasAluno() {
  const { meuTrabalho } = useDemo();
  const naoLidos = meuTrabalho.etapas.flatMap((e) => e.feedbacks).filter((f) => !f.lidoEm).length;

  return (
    <Tabs tabBar={(props) => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="cronograma" options={{ title: 'Cronograma' }} />
      <Tabs.Screen
        name="entregas"
        options={{ title: 'Entregas', tabBarBadge: naoLidos > 0 ? naoLidos : undefined }}
      />
      <Tabs.Screen name="proposta" options={{ title: 'Proposta' }} />
    </Tabs>
  );
}
