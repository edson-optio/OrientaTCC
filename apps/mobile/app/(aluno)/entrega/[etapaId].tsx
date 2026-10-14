import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CartaParecer, LinhaVersao } from '../../../src/components/dominio';
import { Botao } from '../../../src/components/ui/Botao';
import { Chip } from '../../../src/components/ui/Chip';
import { Icone } from '../../../src/components/ui/Icone';
import { BarraNav, Secao, Tela } from '../../../src/components/ui/Tela';
import { Texto } from '../../../src/components/ui/Texto';
import { diaMes, prazoRelativo } from '../../../src/lib/datas';
import { STATUS_ENTREGA } from '../../../src/lib/dominio';
import { TAMANHO_MAXIMO_KB, useDemo } from '../../../src/lib/demo';
import { cores, raio } from '../../../src/tema/tokens';

type Arquivo = { nome: string; tamanhoKb: number };

/**
 * Entrega de uma etapa (UC04 + UC06): parecer mais recente em destaque,
 * historico de versoes e area fixa de envio da proxima versao.
 * Abrir a tela marca os pareceres como lidos (PATCH /feedbacks/:id/lido).
 */
export default function Entrega() {
  const { etapaId } = useLocalSearchParams<{ etapaId: string }>();
  const { meuTrabalho, enviarVersao, marcarLido } = useDemo();
  const indice = meuTrabalho.etapas.findIndex((e) => e.id === Number(etapaId));
  const etapa = meuTrabalho.etapas[indice];

  // Guarda os nao lidos da abertura para manter o "NOVO" durante esta visita.
  const [naoLidosNaAbertura] = useState(() => new Set(etapa?.feedbacks.filter((f) => !f.lidoEm).map((f) => f.id)));
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    naoLidosNaAbertura.forEach((id) => marcarLido(meuTrabalho.id, id));
  }, [naoLidosNaAbertura, marcarLido, meuTrabalho.id]);

  if (!etapa) {
    return (
      <Tela>
        <BarraNav />
        <Texto variante="titulo">Etapa não encontrada.</Texto>
      </Tela>
    );
  }

  const status = STATUS_ENTREGA[etapa.status];
  const feedbacks = [...etapa.feedbacks].reverse();
  const ultimo = feedbacks[0];
  const versoes = [...etapa.versoes].reverse();
  const aprovada = etapa.status === 'aprovada';
  const proxima = etapa.versoes.length + 1;

  async function escolherArquivo() {
    setErro(null);
    setEnviado(false);
    const resultado = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false });
    if (resultado.canceled) return;
    const doc = resultado.assets[0];
    const tamanhoKb = Math.round((doc.size ?? 0) / 1024);
    if (!doc.name.toLowerCase().endsWith('.pdf')) {
      setErro('Selecione um arquivo PDF.');
      return;
    }
    if (tamanhoKb > TAMANHO_MAXIMO_KB) {
      setErro(`O arquivo tem ${(tamanhoKb / 1024).toFixed(1)} MB. O limite é 2 MB.`);
      return;
    }
    setArquivo({ nome: doc.name, tamanhoKb });
  }

  function enviar() {
    if (!arquivo) return;
    enviarVersao(meuTrabalho.id, etapa.id, arquivo.nome, arquivo.tamanhoKb);
    setArquivo(null);
    setEnviado(true);
  }

  const rodape = aprovada ? undefined : (
    <>
      {erro && (
        <View style={estilos.erro} accessibilityLiveRegion="polite">
          <Icone nome="alerta" tamanho={16} cor={cores.atrasada} />
          <Texto variante="legenda" cor={cores.atrasada} style={{ flex: 1 }}>
            {erro}
          </Texto>
        </View>
      )}
      {enviado && !arquivo && (
        <View style={estilos.sucesso} accessibilityLiveRegion="polite">
          <Icone nome="check" tamanho={16} cor={cores.aprovada} espessura={2.6} />
          <Texto variante="legenda" cor={cores.aprovada} style={{ flex: 1 }}>
            Versão {etapa.versoes.length} enviada. A orientadora foi avisada.
          </Texto>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={arquivo ? `Arquivo selecionado: ${arquivo.nome}. Trocar arquivo` : `Selecionar PDF da versão ${proxima}`}
        onPress={escolherArquivo}
        style={({ pressed }) => [estilos.seletor, arquivo && estilos.seletorCheio, pressed && { opacity: 0.7 }]}
      >
        <Icone nome="arquivo" tamanho={22} espessura={1.8} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Texto variante="corpoForte" numberOfLines={1} style={{ fontSize: 15 }}>
            {arquivo ? arquivo.nome : `Selecionar PDF da versão ${proxima}`}
          </Texto>
          <Texto variante="legenda" style={{ fontSize: 12 }}>
            {arquivo ? `${(arquivo.tamanhoKb / 1024).toFixed(1).replace('.', ',')} MB · toque para trocar` : 'Apenas PDF, até 2 MB'}
          </Texto>
        </View>
      </Pressable>
      <Botao rotulo="Enviar para avaliação" desabilitado={!arquivo} aoPressionar={enviar} />
    </>
  );

  return (
    <Tela rodape={rodape}>
      <BarraNav titulo={`Etapa ${indice + 1} de ${meuTrabalho.etapas.length}`} />

      <View style={{ gap: 10 }}>
        <Texto variante="display" accessibilityRole="header">
          {etapa.nome}
        </Texto>
        <View style={estilos.meta}>
          <Chip rotulo={status.rotulo} tom={status.tom} />
          <Texto variante="legenda">
            Prazo {diaMes(etapa.prazo)}
            {!aprovada ? ` · ${prazoRelativo(etapa.prazo)}` : ''}
          </Texto>
        </View>
      </View>

      {ultimo ? (
        <CartaParecer
          feedback={ultimo}
          novo={naoLidosNaAbertura.has(ultimo.id)}
          numeroVersao={etapa.versoes.find((v) => v.id === ultimo.versaoId)?.numero ?? 1}
        />
      ) : (
        <View style={estilos.vazio}>
          <Texto variante="subtitulo">
            {etapa.versoes.length ? 'Aguardando o parecer.' : 'Nenhuma versão enviada ainda.'}
          </Texto>
          <Texto variante="corpo" cor={cores.suave}>
            {etapa.versoes.length
              ? `${meuTrabalho.orientador} vai avaliar a versão ${etapa.versoes.length} e registrar o parecer aqui.`
              : 'Envie o PDF desta etapa. Você pode mandar novas versões depois; todas ficam no histórico.'}
          </Texto>
        </View>
      )}

      {versoes.length > 0 && (
        <Secao rotulo="Versões">
          {versoes.map((v, i) => (
            <LinhaVersao
              key={v.id}
              versao={v}
              feedback={etapa.feedbacks.find((f) => f.versaoId === v.id)}
              ultima={i === versoes.length - 1}
            />
          ))}
        </Secao>
      )}

      {feedbacks.length > 1 && (
        <Secao rotulo="Pareceres anteriores">
          {feedbacks.slice(1).map((f) => (
            <View key={f.id} style={estilos.anterior}>
              <Texto variante="legenda">
                v{etapa.versoes.find((v) => v.id === f.versaoId)?.numero} · {f.parecer === 'aprovado' ? 'Aprovado' : 'Revisar'}
              </Texto>
              <Texto variante="corpo">{f.comentarios}</Texto>
            </View>
          ))}
        </Secao>
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  vazio: {
    gap: 8,
    padding: 20,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
  },
  anterior: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BDBDB6',
    backgroundColor: cores.superficie,
  },
  seletorCheio: {
    borderStyle: 'solid',
    borderColor: cores.tinta,
    backgroundColor: cores.fundo,
  },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: raio.sm,
    backgroundColor: cores.atrasadaFundo,
  },
  sucesso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: raio.sm,
    backgroundColor: cores.aprovadaFundo,
  },
});
