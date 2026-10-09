import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TelaPlaceholder } from '../../../src/components/TelaPlaceholder';

/** UC02 Responder proposta de orientacao. */
export default function PropostasOrientador() {
  return (
    <TelaPlaceholder
      titulo="Propostas recebidas"
      casoDeUso="UC02 Responder proposta de orientacao"
      descricao="Aqui o professor lista as propostas recebidas, consulta os detalhes e aceita, devolve para ajustes ou recusa com justificativa. O aceite so e permitido se o limite de orientandos nao foi atingido; ao aceitar, o sistema cria o trabalho 'Em orientacao' e vincula a orientacao."
      operacoes={[
        'listarPropostasRecebidas(professorId)',
        'consultarProposta(propostaId)',
        'contarOrientandos(professorId)',
        'obterParametro("limiteOrientandos")',
        'verificarLimiteOrientandos(professorId)',
        'aceitarProposta(propostaId)',
        'criarTrabalho(propostaId)',
        'vincularOrientador(trabalhoId, professorId)',
        'devolverProposta(propostaId, justificativa)',
        'recusarProposta(propostaId, justificativa)',
        'enviarNotificacao(destinatarioId, tipo, conteudo)',
      ]}
    >
      <View style={estilos.avisoLimite}>
        <Text style={estilos.avisoTexto}>
          Limite de orientandos: 0 de 5 (vira de contarOrientandos + obterParametro)
        </Text>
      </View>

      <View style={estilos.cartao}>
        <Text style={estilos.cartaoTitulo}>Exemplo de proposta</Text>
        <Text style={estilos.cartaoTexto}>Aluno · Tema · Area · Aguardando orientador</Text>
        <View style={estilos.acoes}>
          <Botao rotulo="Aceitar" cor="#1a7f37" />
          <Botao rotulo="Ajustes" cor="#9a6700" />
          <Botao rotulo="Recusar" cor="#cf222e" />
        </View>
      </View>
    </TelaPlaceholder>
  );
}

function Botao({ rotulo, cor }: { rotulo: string; cor: string }) {
  return (
    <Pressable style={({ pressed }) => [estilos.botao, { borderColor: cor }, pressed && estilos.botaoPressionado]}>
      <Text style={[estilos.botaoTexto, { color: cor }]}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  avisoLimite: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 12,
  },
  avisoTexto: {
    fontSize: 13,
    color: '#8a6d00',
  },
  cartao: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cartaoTitulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartaoTexto: {
    fontSize: 13,
    color: '#555',
  },
  acoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botao: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  botaoPressionado: {
    opacity: 0.6,
  },
  botaoTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
});
