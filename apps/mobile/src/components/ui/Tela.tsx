import { Link, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessao } from '../../lib/sessao';
import { cores, ESPACO_BARRA_ABAS, espaco, MARGEM_TELA, raio } from '../../tema/tokens';
import { Avatar } from './Avatar';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

type TelaProps = {
  children: ReactNode;
  /** true nas telas dentro de abas: reserva espaco para a barra flutuante. */
  comAbas?: boolean;
  /** Conteudo fixo no rodape (ex.: area de envio). */
  rodape?: ReactNode;
  estiloConteudo?: StyleProp<ViewStyle>;
};

/** Container de tela: fundo branco, area segura e rolagem. */
export function Tela({ children, comAbas, rodape, estiloConteudo }: TelaProps) {
  const insets = useSafeAreaInsets();
  const espacoFinal = comAbas ? ESPACO_BARRA_ABAS : rodape ? espaco[5] : insets.bottom + espaco[6];

  return (
    <View style={estilos.tela}>
      <ScrollView
        contentContainerStyle={[
          estilos.conteudo,
          { paddingTop: insets.top + espaco[2], paddingBottom: espacoFinal },
          estiloConteudo,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {rodape && <View style={[estilos.rodape, { paddingBottom: insets.bottom + espaco[3] }]}>{rodape}</View>}
    </View>
  );
}

type CabecalhoProps = {
  sobretitulo?: string;
  titulo: string;
  /** Mostra sino de notificacoes e avatar do usuario. */
  comAcoes?: boolean;
  temNovidade?: boolean;
};

/** Cabecalho editorial das telas principais: rotulo mono + titulo Fraunces. */
export function Cabecalho({ sobretitulo, titulo, comAcoes = true, temNovidade }: CabecalhoProps) {
  const { usuario, sair } = useSessao();
  const router = useRouter();

  return (
    <View style={estilos.cabecalho}>
      <View style={estilos.cabecalhoTextos}>
        {sobretitulo && <Texto variante="rotulo">{sobretitulo}</Texto>}
        <Texto variante="display" accessibilityRole="header">
          {titulo}
        </Texto>
      </View>
      {comAcoes && (
        <View style={estilos.acoes}>
          <Link href="/notificacoes" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={temNovidade ? 'Notificações, há novidades' : 'Notificações'}
              style={({ pressed }) => [estilos.botaoRedondo, pressed && estilos.pressionado]}
            >
              <Icone nome="sino" tamanho={20} espessura={1.8} />
              {temNovidade && <View style={estilos.ponto} />}
            </Pressable>
          </Link>
          {usuario && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${usuario.nome}. Trocar de perfil`}
              onPress={() => {
                sair();
                router.replace('/');
              }}
              style={({ pressed }) => pressed && estilos.pressionado}
            >
              <Avatar nome={usuario.nome} tamanho={44} escuro />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

type BarraNavProps = {
  titulo?: string;
  acaoDireita?: { icone: NomeIcone; rotulo: string; aoPressionar: () => void };
};

/** Barra de navegacao das telas empilhadas: voltar, rotulo central, acao. */
export function BarraNav({ titulo, acaoDireita }: BarraNavProps) {
  const router = useRouter();
  return (
    <View style={estilos.barraNav}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [estilos.botaoRedondo, pressed && estilos.pressionado]}
      >
        <Icone nome="voltar" tamanho={20} />
      </Pressable>
      {titulo ? <Texto variante="rotulo">{titulo}</Texto> : <View />}
      {acaoDireita ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={acaoDireita.rotulo}
          onPress={acaoDireita.aoPressionar}
          style={({ pressed }) => [estilos.botaoRedondo, pressed && estilos.pressionado]}
        >
          <Icone nome={acaoDireita.icone} tamanho={20} />
        </Pressable>
      ) : (
        <View style={estilos.vazio} />
      )}
    </View>
  );
}

type SecaoProps = {
  rotulo: string;
  acao?: ReactNode;
  children: ReactNode;
  estilo?: StyleProp<ViewStyle>;
};

/** Secao com rotulo mono; o conteudo fica direto na superficie, sem card. */
export function Secao({ rotulo, acao, children, estilo }: SecaoProps) {
  return (
    <View style={[estilos.secao, estilo]}>
      <View style={estilos.secaoTopo}>
        <Texto variante="rotulo">{rotulo}</Texto>
        {acao}
      </View>
      {children}
    </View>
  );
}

/** Divisor fino entre linhas de lista. */
export function Divisor() {
  return <View style={estilos.divisor} />;
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    paddingHorizontal: MARGEM_TELA,
    gap: 28,
  },
  rodape: {
    paddingHorizontal: 20,
    paddingTop: espaco[4],
    backgroundColor: cores.fundo,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    gap: 10,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: espaco[3],
  },
  cabecalhoTextos: {
    flex: 1,
    gap: 6,
  },
  acoes: {
    flexDirection: 'row',
    gap: espaco[2],
    paddingTop: 4,
  },
  botaoRedondo: {
    width: 44,
    height: 44,
    borderRadius: raio.total,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: {
    opacity: 0.6,
  },
  ponto: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: cores.atrasada,
    borderWidth: 2,
    borderColor: cores.superficie,
  },
  barraNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -8,
    marginBottom: -12,
  },
  vazio: {
    width: 44,
  },
  secao: {
    gap: 6,
  },
  secaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 20,
  },
  divisor: {
    height: 1,
    backgroundColor: cores.linha,
  },
});
