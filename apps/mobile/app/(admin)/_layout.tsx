import { Tabs } from 'expo-router/js-tabs';

import { useSessaoDoPerfil } from '../../src/lib/sessao';
import { BarraAbas } from '../../src/components/ui/BarraAbas';

/** Abas do perfil Administrador (cadastros e parametros). */
export default function LayoutAdmin() {
  useSessaoDoPerfil('admin');
  return (
    <Tabs tabBar={(props) => <BarraAbas {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="usuarios" options={{ title: 'Usuários' }} />
      <Tabs.Screen name="cursos" options={{ title: 'Cursos' }} />
      <Tabs.Screen name="parametros" options={{ title: 'Parâmetros' }} />
    </Tabs>
  );
}
