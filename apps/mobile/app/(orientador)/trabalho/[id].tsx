import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Marco, TextoPrazo, tipoMarco } from '../../../src/components/dominio';
import { Avatar } from '../../../src/components/ui/Avatar';
import { Botao } from '../../../src/components/ui/Botao';
import { Chip } from '../../../src/components/ui/Chip';
import { Icone } from '../../../src/components/ui/Icone';
import { BarraNav, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { diaMes } from '../../../src/lib/datas';
import { STATUS_ENTREGA } from '../../../src/lib/dominio';
import { aguardandoParecer, etapaAtual, useDemo } from '../../../src/lib/demo';
import { cores, raio } from '../../../src/tema/tokens';

/**
 * Detalhe do trabalho de um orientando: cronograma em linha do tempo (UC03)
 * e requisitos para a conclusao (UC07).
 */
export default function DetalheTrabalho() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { estado } = useDemo();
  const trabalho = estado.trabalhos.find((t) => t.id === Number(id));

  if (!trabalho) {
    return (
      <Tela>
        <BarraNav />
        <Texto variante="titulo">Trabalho não encontrado.</Texto>
      </Tela>
    );
  }

  const atual = etapaAtual(trabalho);
  const pendencias = trabalho.etapas.filter((e) => e.obrigatoria && e.status !== 'aprovada');
  const podeConcluir = trabalho.etapas.length > 0 && pendencias.length === 0;

  return (
    <Tela>
      <BarraNav titulo="Trabalho" />

      <View style={{ gap: 12 }}>
        <View style={estilos.aluno}>
          <Avatar nome={trabalho.aluno} tamanho={44} />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoForte">{trabalho.aluno}</Texto>
            <Texto variante="legenda">
              {trabalho.curso} · {trabalho.semestre}
            </Texto>
          </View>
        </View>
        <Texto variante="titulo" accessibilityRole="header">
          {trabalho.titulo}
        </Texto>
      </View>

      <Secao
        rotulo={trabalho.cronogramaPublicadoEm ? `Cronograma · publicado ${diaMes(trabalho.cronogramaPublicadoEm)}` : 'Cronograma'}
      >
        {trabalho.etapas.length === 0 ? (
          <View style={estilos.vazio}>
            <Texto variante="subtitulo">Defina as etapas deste trabalho.</Texto>
            <Texto variante="corpo" cor={cores.suave}>
              Crie etapas com nome, tipo e prazo, ou copie o cronograma de outro orientando como modelo. O aluno só vê o
              cronograma depois de publicado.
            </Texto>
            <Botao compacto rotulo="Criar cronograma" icone="mais" estilo={{ alignSelf: 'flex-start' }} />
          </View>
        ) : (
          <View style={{ paddingTop: 12 }}>
            {trabalho.etapas.map((etapa, i) => {
              const status = STATUS_ENTREGA[etapa.status];
              return (
                <Marco
                  key={etapa.id}
                  tipo={tipoMarco(etapa, atual?.id)}
                  numero={i + 1}
                  linhaCheia={etapa.status === 'aprovada'}
                  ultimo={i === trabalho.etapas.length - 1}
                >
                  <View style={{ gap: 4 }}>
                    <Texto variante="corpoForte">{etapa.nome}</Texto>
                    <TextoPrazo etapa={etapa} />
                    <View style={estilos.linhaChip}>
                      <Chip pequeno rotulo={status.rotulo} tom={status.tom} />
                      <Texto variante="legenda">
                        {etapa.versoes.length} {etapa.versoes.length === 1 ? 'versão' : 'versões'}
                      </Texto>
                    </View>
                  </View>
                  {aguardandoParecer(etapa) && (
                    <Botao
                      compacto
                      rotulo={`Avaliar v${etapa.versoes.length}`}
                      aoPressionar={() => router.push(`/(orientador)/avaliacao/${etapa.id}?trabalho=${trabalho.id}`)}
                      estilo={{ alignSelf: 'flex-start' }}
                    />
                  )}
                </Marco>
              );
            })}
          </View>
        )}
      </Secao>

      <Secao rotulo="Conclusão">
        <View style={estilos.conclusao}>
          {podeConcluir ? (
            <Texto variante="corpo">Todas as etapas obrigatórias foram aprovadas. Você pode registrar o resultado final.</Texto>
          ) : (
            <>
              <Texto variante="corpo">Para concluir, faltam:</Texto>
              {(pendencias.length ? pendencias : []).map((e) => (
                <View key={e.id} style={estilos.pendencia}>
                  <Icone nome="relogio" tamanho={16} cor={cores.suave} />
                  <Texto variante="legenda" cor={cores.tinta}>
                    {e.nome} aprovada
                  </Texto>
                </View>
              ))}
              {trabalho.etapas.length === 0 && (
                <Texto variante="legenda">Cronograma com etapas obrigatórias publicado</Texto>
              )}
            </>
          )}
          <Botao
            rotulo="Registrar resultado final"
            variante={podeConcluir ? 'primario' : 'secundario'}
            desabilitado={!podeConcluir}
            compacto
          />
        </View>
      </Secao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  aluno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vazio: {
    gap: 10,
    padding: 20,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
  },
  linhaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  conclusao: {
    gap: 10,
    padding: 16,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
  },
  pendencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
