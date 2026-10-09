import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { TelaPlaceholder } from '../../src/components/TelaPlaceholder';

/**
 * UC01 Submeter proposta de tema.
 * Formulario provisorio: os campos ainda nao sao enviados a API. Quando a
 * integracao existir, o botao chamara cadastrarProposta + submeterProposta e
 * a escolha do professor vira de listarProfessores.
 */
export default function Proposta() {
  const [tema, setTema] = useState('');
  const [resumo, setResumo] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [area, setArea] = useState('');
  const [professor, setProfessor] = useState('');

  return (
    <TelaPlaceholder
      titulo="Proposta de tema"
      casoDeUso="UC01 Submeter proposta de tema"
      descricao="Aqui o aluno informa tema, resumo, objetivos e area de pesquisa, escolhe o professor orientador e submete a proposta. Se a proposta for devolvida, ele edita e reenvia; se for recusada, pode submeter outra a outro professor."
      operacoes={[
        'verificarPropostaAtiva(alunoId)',
        'listarProfessores()',
        'cadastrarProposta(alunoId, dadosProposta, professorId)',
        'editarProposta(propostaId, dadosProposta, professorId)',
        'submeterProposta(propostaId)',
        'enviarNotificacao(destinatarioId, tipo, conteudo)',
      ]}
    >
      <View style={estilos.status}>
        <Text style={estilos.statusRotulo}>Status da proposta</Text>
        <Text style={estilos.statusValor}>Nenhuma proposta ativa</Text>
      </View>

      <View style={estilos.formulario}>
        <Campo rotulo="Tema" valor={tema} aoMudar={setTema} />
        <Campo rotulo="Resumo" valor={resumo} aoMudar={setResumo} multilinha />
        <Campo rotulo="Objetivos" valor={objetivos} aoMudar={setObjetivos} multilinha />
        <Campo rotulo="Area de pesquisa" valor={area} aoMudar={setArea} />
        <Campo
          rotulo="Professor orientador"
          valor={professor}
          aoMudar={setProfessor}
          dica="Sera uma lista vinda de listarProfessores()"
        />
        <Pressable style={({ pressed }) => [estilos.botao, pressed && estilos.botaoPressionado]}>
          <Text style={estilos.botaoTexto}>Submeter proposta</Text>
        </Pressable>
      </View>
    </TelaPlaceholder>
  );
}

type CampoProps = {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  multilinha?: boolean;
  dica?: string;
};

function Campo({ rotulo, valor, aoMudar, multilinha, dica }: CampoProps) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <TextInput
        style={[estilos.entrada, multilinha && estilos.entradaMultilinha]}
        value={valor}
        onChangeText={aoMudar}
        placeholder={dica ?? rotulo}
        placeholderTextColor="#999"
        multiline={multilinha}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 12,
  },
  statusRotulo: {
    fontSize: 13,
    color: '#666',
  },
  statusValor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8a6d00',
  },
  formulario: {
    gap: 12,
  },
  campo: {
    gap: 4,
  },
  campoRotulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  entrada: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  entradaMultilinha: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  botao: {
    backgroundColor: '#1f6feb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  botaoPressionado: {
    opacity: 0.8,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
