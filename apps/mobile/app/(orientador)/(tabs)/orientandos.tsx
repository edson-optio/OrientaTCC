import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { TelaPlaceholder } from '../../../src/components/TelaPlaceholder';

/** UC09 Acompanhar andamento dos orientandos. */
export default function Orientandos() {
  return (
    <TelaPlaceholder
      titulo="Painel de orientandos"
      casoDeUso="UC09 Acompanhar andamento dos orientandos"
      descricao="Aqui o orientador ve, para cada orientando, o status do trabalho, a etapa vigente, as entregas atrasadas e as pendentes de avaliacao, filtra por status ou periodo e gera um relatorio. Tocar em um orientando abre o detalhe do trabalho."
      operacoes={[
        'listarOrientandos(professorId)',
        'consultarAndamentoOrientandos(professorId)',
        'listarEntregasAtrasadas(professorId)',
        'listarEntregasPendentes(professorId)',
        'gerarRelatorio(professorId, filtros)',
      ]}
    >
      <Link href="/(orientador)/trabalho/exemplo" asChild>
        <Pressable style={({ pressed }) => [estilos.cartao, pressed && estilos.cartaoPressionado]}>
          <Text style={estilos.cartaoTitulo}>Exemplo de orientando</Text>
          <Text style={estilos.cartaoTexto}>Em orientacao · Etapa vigente: Parcial 1 · 0 atrasadas · 0 pendentes</Text>
          <Text style={estilos.cartaoLink}>Abrir trabalho</Text>
        </Pressable>
      </Link>
    </TelaPlaceholder>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  cartaoPressionado: {
    backgroundColor: '#f2f5f9',
  },
  cartaoTitulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartaoTexto: {
    fontSize: 13,
    color: '#555',
  },
  cartaoLink: {
    fontSize: 13,
    color: '#1f6feb',
    fontWeight: '600',
  },
});
