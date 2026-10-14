import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { cores, fontes, raio } from '../../tema/tokens';
import { Texto } from './Texto';

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  multilinha?: boolean;
  dica?: string;
  ajuda?: string;
};

/** Campo de texto sobre superficie cinza; ganha borda de tinta no foco. */
export function Campo({ rotulo, valor, aoMudar, multilinha, dica, ajuda }: Props) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Texto variante="corpoForte" style={{ fontSize: 14 }}>
        {rotulo}
      </Texto>
      <TextInput
        accessibilityLabel={rotulo}
        accessibilityHint={ajuda}
        style={[estilos.entrada, multilinha && estilos.multilinha, foco && estilos.foco]}
        value={valor}
        onChangeText={aoMudar}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        placeholder={dica ?? rotulo}
        placeholderTextColor="#8A8A8A"
        multiline={multilinha}
      />
      {ajuda && <Texto variante="legenda">{ajuda}</Texto>}
    </View>
  );
}

const estilos = StyleSheet.create({
  entrada: {
    minHeight: 48,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontes.sans,
    fontSize: 16,
    color: cores.tinta,
  },
  foco: {
    borderColor: cores.tinta,
    backgroundColor: cores.fundo,
  },
  multilinha: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
