import { useRouter, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusApi } from '../src/components/StatusApi';
import { USUARIOS_SEED, useSessao, type Usuario } from '../src/lib/sessao';

/**
 * Tela de entrada.
 *
 * O seletor de perfil abaixo e PROVISORIO, apenas para desenvolvimento: ele
 * grava no contexto de sessao um dos usuarios do seed da API e navega para o
 * grupo do perfil. Sera substituido pelo login com Better Auth (UC11), que
 * carregara o perfil e as permissoes do usuario autenticado.
 */
const PERFIS: { rotulo: string; descricao: string; usuario: Usuario; href: Href }[] = [
  {
    rotulo: 'Aluno',
    descricao: 'Submete proposta e entregas, consulta cronograma e feedback',
    usuario: USUARIOS_SEED.aluno,
    href: '/(aluno)/proposta',
  },
  {
    rotulo: 'Orientador',
    descricao: 'Responde propostas, define cronograma, avalia e conclui trabalhos',
    usuario: USUARIOS_SEED.professor,
    href: '/(orientador)/(tabs)/propostas',
  },
  {
    rotulo: 'Administrador',
    descricao: 'Gerencia usuarios, cursos, semestres e parametros',
    usuario: USUARIOS_SEED.admin,
    href: '/(admin)/usuarios',
  },
];

export default function TelaEntrada() {
  const router = useRouter();
  const { entrar } = useSessao();

  return (
    <ScrollView contentContainerStyle={estilos.container}>
      <Text style={estilos.titulo}>OrientaTCC</Text>
      <Text style={estilos.subtitulo}>Gestao de Trabalhos de Conclusao de Curso</Text>

      <View style={estilos.secao}>
        <Text style={estilos.rotuloSecao}>Entrar como (provisorio)</Text>
        {PERFIS.map((perfil) => (
          <Pressable
            key={perfil.rotulo}
            onPress={() => {
              entrar(perfil.usuario);
              router.push(perfil.href);
            }}
            style={({ pressed }) => [estilos.botao, pressed && estilos.botaoPressionado]}
          >
            <Text style={estilos.botaoTitulo}>{perfil.rotulo}</Text>
            <Text style={estilos.botaoDescricao}>{perfil.descricao}</Text>
            <Text style={estilos.botaoUsuario}>
              {perfil.usuario.nome} (id {perfil.usuario.id}, seed)
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={estilos.secao}>
        <Text style={estilos.rotuloSecao}>Status da API</Text>
        <StatusApi />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    padding: 24,
    gap: 24,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: -16,
  },
  secao: {
    gap: 12,
  },
  rotuloSecao: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  botao: {
    backgroundColor: '#f2f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  botaoPressionado: {
    backgroundColor: '#e1e8f0',
  },
  botaoTitulo: {
    fontSize: 18,
    fontWeight: '600',
  },
  botaoDescricao: {
    fontSize: 13,
    color: '#555',
  },
  botaoUsuario: {
    fontSize: 12,
    color: '#888',
  },
});
