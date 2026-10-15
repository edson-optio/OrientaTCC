import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { cores, fontes, raio } from '../../tema/tokens';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

/**
 * Barra de abas flutuante em pilula, usada como `tabBar` dos Tabs.
 * O icone de cada aba vem de `ICONES_ABAS` pelo nome da rota.
 */
export const ICONES_ABAS: Record<string, NomeIcone> = {
  inicio: 'inicio',
  cronograma: 'cronograma',
  entregas: 'entregas',
  proposta: 'proposta',
  avaliar: 'inbox',
  propostas: 'proposta',
  orientandos: 'orientandos',
  usuarios: 'usuario',
  cursos: 'curso',
  parametros: 'ajustes',
};

export function BarraAbas({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[estilos.envolve, { bottom: Math.max(insets.bottom, 12) + 4 }]} pointerEvents="box-none">
      <View style={estilos.barra}>
        {state.routes.map((rota, indice) => {
          const { options } = descriptors[rota.key];
          const rotulo = typeof options.title === 'string' ? options.title : rota.name;
          const ativa = state.index === indice;
          const cor = ativa ? cores.tinta : cores.apagado;
          const selo = options.tabBarBadge;

          const aoPressionar = () => {
            const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
            if (!ativa && !evento.defaultPrevented) {
              navigation.navigate(rota.name, rota.params);
            }
          };

          return (
            <Pressable
              key={rota.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={selo ? `${rotulo}, ${selo} pendentes` : rotulo}
              onPress={aoPressionar}
              style={({ pressed }) => [estilos.aba, pressed && estilos.pressionada]}
            >
              <View>
                <Icone nome={ICONES_ABAS[rota.name] ?? 'inicio'} tamanho={22} cor={cor} />
                {selo !== undefined && (
                  <View style={estilos.selo}>
                    <Texto style={estilos.seloTexto}>{String(selo)}</Texto>
                  </View>
                )}
              </View>
              <Texto style={[estilos.rotulo, ativa && estilos.rotuloAtivo]} cor={ativa ? cores.tinta : '#6B6B6B'}>
                {rotulo}
              </Texto>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  envolve: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  barra: {
    height: 64,
    borderRadius: raio.total,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: cores.linha,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  aba: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pressionada: {
    opacity: 0.6,
  },
  rotulo: {
    fontFamily: fontes.sansMedio,
    fontSize: 11,
    lineHeight: 14,
  },
  rotuloAtivo: {
    fontFamily: fontes.sansForte,
  },
  selo: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: cores.grifo,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloTexto: {
    fontFamily: fontes.monoForte,
    fontSize: 10,
    lineHeight: 13,
    color: cores.tinta,
  },
});
