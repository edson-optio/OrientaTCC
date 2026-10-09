import { Tabs } from 'expo-router';

import { BotaoNotificacoes } from '../../src/components/BotaoNotificacoes';
import { IconeTab } from '../../src/components/IconeTab';

/** Abas do perfil Aluno (UC01, UC04 e UC06). */
export default function LayoutAluno() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#1f6feb',
        headerRight: () => <BotaoNotificacoes />,
      }}
    >
      <Tabs.Screen
        name="proposta"
        options={{
          title: 'Proposta',
          tabBarIcon: ({ color }) => <IconeTab simbolo="💡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="meu-trabalho"
        options={{
          title: 'Meu trabalho',
          tabBarIcon: ({ color }) => <IconeTab simbolo="📘" color={color} />,
        }}
      />
      <Tabs.Screen
        name="entregas"
        options={{
          title: 'Entregas',
          tabBarIcon: ({ color }) => <IconeTab simbolo="📤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cronograma"
        options={{
          title: 'Cronograma',
          tabBarIcon: ({ color }) => <IconeTab simbolo="📅" color={color} />,
        }}
      />
    </Tabs>
  );
}
