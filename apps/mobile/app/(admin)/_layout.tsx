import { Tabs } from 'expo-router';

import { IconeTab } from '../../src/components/IconeTab';

/** Abas do perfil Administrador (UC12). */
export default function LayoutAdmin() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center', tabBarActiveTintColor: '#1f6feb' }}>
      <Tabs.Screen
        name="usuarios"
        options={{
          title: 'Usuarios',
          tabBarIcon: ({ color }) => <IconeTab simbolo="👤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color }) => <IconeTab simbolo="🎓" color={color} />,
        }}
      />
      <Tabs.Screen
        name="parametros"
        options={{
          title: 'Parametros',
          tabBarIcon: ({ color }) => <IconeTab simbolo="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}
