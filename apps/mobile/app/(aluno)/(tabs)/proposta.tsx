import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Marco } from '../../../src/components/dominio';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Botao } from '../../../src/components/ui/Botao';
import { Campo } from '../../../src/components/ui/Campo';
import { Chip } from '../../../src/components/ui/Chip';
import { Cabecalho, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { diaMes } from '../../../src/lib/datas';
import { STATUS_PROPOSTA } from '../../../src/lib/dominio';
import { useDemo } from '../../../src/lib/demo';
import { cores, raio } from '../../../src/tema/tokens';

/**
 * Proposta de tema (UC01). Com proposta aceita, mostra o registro e o
 * percurso ate o aceite. O formulario aparece para redigir uma nova proposta
 * (quando nao ha proposta ativa, ou ela foi devolvida/recusada).
 */
export default function Proposta() {
  const { estado, meuTrabalho } = useDemo();
  const proposta = estado.propostaAluno;
  const status = STATUS_PROPOSTA[proposta.status];
  const podeEditar = proposta.status === 'ajustes' || proposta.status === 'recusada' || proposta.status === 'rascunho';
  const [verFormulario, setVerFormulario] = useState(false);

  return (
    <Tela comAbas>
      <Cabecalho titulo="Proposta" sobretitulo={`Submetida em ${diaMes(proposta.submetidaEm)}`} />

      <View style={{ gap: 12 }}>
        <Chip rotulo={status.rotulo} tom={status.tom} />
        <Texto variante="titulo">{proposta.tema}</Texto>
        <View style={estilos.orientador}>
          <Avatar nome={meuTrabalho.orientador} tamanho={32} />
          <Texto variante="legenda">
            Orientação: <Texto variante="legenda" cor={cores.tinta}>{meuTrabalho.orientador}</Texto> ·{' '}
            {proposta.area}
          </Texto>
        </View>
      </View>

      <Secao rotulo="Resumo">
        <Texto variante="corpo">{proposta.resumo}</Texto>
      </Secao>

      <Secao rotulo="Objetivos">
        <Texto variante="corpo">{proposta.objetivos}</Texto>
      </Secao>

      <Secao rotulo="Percurso">
        <View style={{ paddingTop: 10 }}>
          <Marco tipo="feito" linhaCheia>
            <Texto variante="corpoForte">Proposta submetida</Texto>
            <Texto variante="legenda" style={{ marginTop: -10 }}>
              {diaMes(proposta.submetidaEm)}
            </Texto>
          </Marco>
          <Marco tipo={proposta.status === 'aceita' ? 'feito' : 'atual'} ultimo>
            <Texto variante="corpoForte">
              {proposta.status === 'aceita' ? 'Aceita pela orientadora' : 'Aguardando resposta'}
            </Texto>
            <Texto variante="legenda" style={{ marginTop: -10 }}>
              {proposta.status === 'aceita'
                ? `Trabalho criado em ${diaMes(meuTrabalho.propostaAceitaEm)}`
                : 'A orientadora pode aceitar, devolver para ajustes ou recusar.'}
            </Texto>
          </Marco>
        </View>
      </Secao>

      {podeEditar || verFormulario ? (
        <FormularioProposta />
      ) : (
        <View style={estilos.aviso}>
          <Texto variante="legenda">
            Você já tem uma proposta ativa. Uma nova proposta só pode ser enviada se esta for recusada ou
            devolvida.
          </Texto>
          <Botao compacto variante="secundario" rotulo="Ver formulário" aoPressionar={() => setVerFormulario(true)} />
        </View>
      )}
    </Tela>
  );
}

function FormularioProposta() {
  const [campos, setCampos] = useState({ tema: '', resumo: '', objetivos: '', area: '' });
  const atualizar = (chave: keyof typeof campos) => (texto: string) => setCampos((c) => ({ ...c, [chave]: texto }));
  const completo = Object.values(campos).every((v) => v.trim().length > 0);

  return (
    <Secao rotulo="Nova proposta">
      <View style={{ gap: 14, paddingTop: 6 }}>
        <Campo rotulo="Tema" valor={campos.tema} aoMudar={atualizar('tema')} dica="Ex.: Acessibilidade em apps bancários" />
        <Campo rotulo="Resumo" valor={campos.resumo} aoMudar={atualizar('resumo')} multilinha />
        <Campo rotulo="Objetivos" valor={campos.objetivos} aoMudar={atualizar('objetivos')} multilinha />
        <Campo rotulo="Área de pesquisa" valor={campos.area} aoMudar={atualizar('area')} dica="Ex.: Engenharia de Software" />
        <Botao rotulo="Submeter proposta" desabilitado={!completo} />
        <Texto variante="legenda">
          A escolha do orientador e o envio dependem dos endpoints de proposta, ainda não disponíveis na API.
        </Texto>
      </View>
    </Secao>
  );
}

const estilos = StyleSheet.create({
  orientador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aviso: {
    gap: 12,
    padding: 16,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    alignItems: 'flex-start',
  },
});
