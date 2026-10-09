import { Tabs } from 'expo-router';

import { BotaoNotificacoes } from '../../../src/components/BotaoNotificacoes';
import { IconeTab } from '../../../src/components/IconeTab';

/** Abas do perfil Orientador (UC02, UC05 e UC09). */
export default function AbasOrientador() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#1f6feb',
        headerRight: () => <BotaoNotificacoes />,
      }}
    >
      <Tabs.Screen
        name="propostas"
        options={{
          title: 'Propostas',
          tabBarIcon: ({ color }) => <IconeTab simbolo="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orientandos"
        options={{
          title: 'Orientandos',
          tabBarIcon: ({ color }) => <IconeTab simbolo="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="entregas"
        options={{
          title: 'Entregas',
          tabBarIcon: ({ color }) => <IconeTab simbolo="📝" color={color} />,
        }}
      />
    </Tabs>
  );
}
