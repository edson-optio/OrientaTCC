import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { StatusApi } from '../src/components/StatusApi';
import { Avatar } from '../src/components/ui/Avatar';
import { Icone } from '../src/components/ui/Icone';
import { Secao, Tela } from '../src/components/ui/Tela';
import { Texto } from '../src/components/ui/Texto';
import { USUARIOS_SEED, useSessao, type Usuario } from '../src/lib/sessao';
import { cores, fontes } from '../src/tema/tokens';

/**
 * Tela de entrada.
 *
 * O seletor de perfil e PROVISORIO, apenas para desenvolvimento: grava no
 * contexto de sessao um dos usuarios do seed da API e navega para o grupo do
 * perfil. Sera substituido pelo login com Better Auth.
 */
const PERFIS: { rotulo: string; descricao: string; usuario: Usuario; href: Href }[] = [
  {
    rotulo: 'Aluno',
    descricao: 'Proposta, cronograma, entregas e pareceres',
    usuario: USUARIOS_SEED.aluno,
    href: '/(aluno)/(tabs)/inicio',
  },
  {
    rotulo: 'Orientador',
    descricao: 'Propostas recebidas, avaliações e orientandos',
    usuario: USUARIOS_SEED.professor,
    href: '/(orientador)/(tabs)/avaliar',
  },
  {
    rotulo: 'Administrador',
    descricao: 'Usuários, cursos e parâmetros',
    usuario: USUARIOS_SEED.admin,
    href: '/(admin)/usuarios',
  },
];

export default function TelaEntrada() {
  const router = useRouter();
  const { entrar } = useSessao();

  return (
    <Tela estiloConteudo={estilos.conteudo}>
      <View style={estilos.marca}>
        <Texto variante="rotulo">Semestre 2026.2</Texto>
        <View style={estilos.logotipo}>
          <Texto style={estilos.logo}>Orienta</Texto>
          <View style={estilos.grifo}>
            <Texto style={estilos.logo}>TCC</Texto>
          </View>
        </View>
        <Texto variante="corpo" cor={cores.suave} style={estilos.slogan}>
          O caderno de orientação do seu trabalho de conclusão: da proposta à versão final, com cada parecer
          guardado.
        </Texto>
      </View>

      <Secao rotulo="Entrar como · modo de desenvolvimento">
        {PERFIS.map((perfil, indice) => (
          <Pressable
            key={perfil.rotulo}
            accessibilityRole="button"
            accessibilityLabel={`Entrar como ${perfil.rotulo}, ${perfil.usuario.nome}`}
            onPress={() => {
              entrar(perfil.usuario);
              router.push(perfil.href);
            }}
            style={({ pressed }) => [
              estilos.perfil,
              indice < PERFIS.length - 1 && estilos.perfilBorda,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Avatar nome={perfil.usuario.nome} tamanho={48} escuro={indice === 0} />
            <View style={estilos.perfilTextos}>
              <Texto variante="corpoGrande">{perfil.rotulo}</Texto>
              <Texto variante="legenda">{perfil.descricao}</Texto>
              <Texto variante="rotulo" style={estilos.perfilUsuario}>
                {perfil.usuario.nome}
              </Texto>
            </View>
            <Icone nome="avancar" tamanho={18} cor="#8A8A8A" />
          </Pressable>
        ))}
      </Secao>

      <Secao rotulo="Status da API">
        <StatusApi />
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    gap: 40,
    paddingTop: 72,
  },
  marca: {
    gap: 14,
  },
  logotipo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontFamily: fontes.display,
    fontSize: 52,
    lineHeight: 60,
    letterSpacing: -1.8,
    color: cores.tinta,
  },
  grifo: {
    backgroundColor: cores.grifo,
    paddingHorizontal: 6,
    marginLeft: 2,
    transform: [{ rotate: '-1.5deg' }],
  },
  slogan: {
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 320,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  perfilBorda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  perfilTextos: {
    flex: 1,
    gap: 2,
  },
  perfilUsuario: {
    marginTop: 4,
    fontSize: 11,
  },
});
