import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { TelaPlaceholder } from '../../../src/components/TelaPlaceholder';

/**
 * Detalhe do trabalho de um orientando (fora das abas).
 * Secao Cronograma: UC03 Definir cronograma de entregas.
 * Secao Conclusao: UC08 Concluir trabalho e registrar resultado final.
 */
export default function DetalheTrabalho() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: `Trabalho ${id}` }} />
      <TelaPlaceholder
        titulo="Detalhe do trabalho"
        casoDeUso="UC03 Definir cronograma / UC08 Concluir trabalho"
        descricao="Aqui o orientador gerencia o cronograma do trabalho e, quando a versao final estiver entregue com parecer favoravel, registra o resultado final e o parecer conclusivo."
        operacoes={[
          'consultarTrabalho(trabalhoId)',
          '— Cronograma (UC03) —',
          'criarCronograma(trabalhoId)',
          'definirEtapa(cronogramaId, nome, tipo, prazo)',
          'publicarCronograma(cronogramaId)',
          'alterarPrazo(etapaId, novaData)',
          'copiarCronograma(cronogramaOrigemId, trabalhoId)',
          '— Conclusao (UC08) —',
          'verificarRequisitosConclusao(trabalhoId)',
          'registrarResultadoFinal(trabalhoId, resultado, parecer)',
          'registrarPrazoCorrecao(trabalhoId, prazo)',
          'atualizarStatusTrabalho(trabalhoId, "CONCLUIDO")',
          'enviarNotificacao(destinatarioId, tipo, conteudo)',
        ]}
      >
        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Cronograma (UC03)</Text>
          <Text style={estilos.secaoTexto}>
            Etapas com nome, tipo (parcial ou final) e prazo. Publicar torna o cronograma visivel ao
            aluno; alterar um prazo publicado notifica o aluno. E possivel reutilizar o cronograma de
            outro orientando como modelo.
          </Text>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>Conclusao (UC08)</Text>
          <Text style={estilos.secaoTexto}>
            Resultado final: aprovado, aprovado com ressalvas (com prazo para a versao corrigida) ou
            reprovado, mais o parecer conclusivo. Se as etapas obrigatorias nao estiverem concluidas
            ou a versao final nao tiver parecer favoravel, o sistema lista as pendencias e bloqueia.
          </Text>
        </View>
      </TelaPlaceholder>
    </>
  );
}

const estilos = StyleSheet.create({
  secao: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  secaoTexto: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
});
