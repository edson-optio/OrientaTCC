import { Tabs } from 'expo-router/js-tabs';

import { BarraAbas } from '../../../src/components/ui/BarraAbas';
import { aguardandoParecer, useDemo } from '../../../src/lib/demo';

/** Abas do perfil Orientador (UC02, UC05 e UC08). */
export default function AbasOrientador() {
  const { orientandosAtivos, estado } = useDemo();
  const paraAvaliar = orientandosAtivos.flatMap((t) => t.etapas).filter(aguardandoParecer).length;
  const propostasNovas = estado.propostasRecebidas.filter((p) => p.status === 'aguardando_orientador').length;

  return (
    <Tabs tabBar={(props) => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="avaliar"
        options={{ title: 'Início', tabBarBadge: paraAvaliar > 0 ? paraAvaliar : undefined }}
      />
      <Tabs.Screen
        name="propostas"
        options={{ title: 'Propostas', tabBarBadge: propostasNovas > 0 ? propostasNovas : undefined }}
      />
      <Tabs.Screen name="orientandos" options={{ title: 'Orientandos' }} />
    </Tabs>
  );
}
