import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { cores } from '../../tema/tokens';

/**
 * Icones de traco (24x24, stroke arredondado), os mesmos das telas do Paper.
 * Substituem os emojis usados antes nas abas.
 */
export type NomeIcone =
  | 'inicio'
  | 'cronograma'
  | 'entregas'
  | 'proposta'
  | 'orientandos'
  | 'inbox'
  | 'sino'
  | 'voltar'
  | 'avancar'
  | 'mais'
  | 'check'
  | 'revisar'
  | 'relogio'
  | 'alerta'
  | 'enviar'
  | 'baixar'
  | 'arquivo'
  | 'bandeira'
  | 'fechar'
  | 'usuario'
  | 'curso'
  | 'ajustes'
  | 'sair';

type Props = {
  nome: NomeIcone;
  tamanho?: number;
  cor?: string;
  espessura?: number;
};

export function Icone({ nome, tamanho = 22, cor = cores.tinta, espessura = 2 }: Props) {
  const traco = {
    stroke: cor,
    strokeWidth: espessura,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {desenho(nome, traco, cor)}
    </Svg>
  );
}

type Traco = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
};

function desenho(nome: NomeIcone, t: Traco, cor: string) {
  switch (nome) {
    case 'inicio':
      return <Path {...t} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />;
    case 'cronograma':
      return (
        <>
          <Path {...t} d="M6 3v18" />
          <Circle {...t} cx={6} cy={6} r={2.2} fill="#FFFFFF" />
          <Circle {...t} cx={6} cy={13} r={2.2} fill="#FFFFFF" />
          <Path {...t} d="M11 6h9M11 13h9M11 20h6" />
        </>
      );
    case 'entregas':
      return (
        <>
          <Path {...t} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <Path {...t} d="M14 3v5h5M9 13h6M9 17h4" />
        </>
      );
    case 'proposta':
      return (
        <>
          <Path {...t} d="M9 18h6M10 21h4" />
          <Path {...t} d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3" />
        </>
      );
    case 'orientandos':
      return (
        <>
          <Circle {...t} cx={9} cy={8} r={3.5} />
          <Path {...t} d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
        </>
      );
    case 'inbox':
      return (
        <>
          <Path {...t} d="M3 13h5l1.5 3h5L16 13h5" />
          <Path {...t} d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" />
        </>
      );
    case 'sino':
      return (
        <>
          <Path {...t} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <Path {...t} d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>
      );
    case 'voltar':
      return <Path {...t} d="m15 18-6-6 6-6" />;
    case 'avancar':
      return <Path {...t} d="m9 18 6-6-6-6" />;
    case 'mais':
      return <Path {...t} d="M12 5v14M5 12h14" />;
    case 'check':
      return <Path {...t} d="m5 12 5 5 9-10" />;
    case 'revisar':
      return <Path {...t} d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />;
    case 'relogio':
      return (
        <>
          <Circle {...t} cx={12} cy={12} r={9} />
          <Path {...t} d="M12 7v5l3 2" />
        </>
      );
    case 'alerta':
      return (
        <>
          <Path {...t} d="M12 3 2 20h20z" />
          <Path {...t} d="M12 10v4M12 17h.01" />
        </>
      );
    case 'enviar':
      return <Path {...t} d="M12 16V4M6 10l6-6 6 6M4 20h16" />;
    case 'baixar':
      return <Path {...t} d="M12 4v12M6 10l6 6 6-6M4 20h16" />;
    case 'arquivo':
      return (
        <>
          <Path {...t} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <Path {...t} d="M14 3v5h5M12 18v-6M9 15l3-3 3 3" />
        </>
      );
    case 'bandeira':
      return <Path {...t} d="M4 21V4h12l-2 4 2 4H4" />;
    case 'fechar':
      return <Path {...t} d="M6 6l12 12M18 6 6 18" />;
    case 'usuario':
      return (
        <>
          <Circle {...t} cx={12} cy={8} r={4} />
          <Path {...t} d="M4 21a8 8 0 0 1 16 0" />
        </>
      );
    case 'curso':
      return (
        <>
          <Path {...t} d="M2 9l10-5 10 5-10 5z" />
          <Path {...t} d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </>
      );
    case 'ajustes':
      return (
        <>
          <Path {...t} d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
          <Circle {...t} cx={16} cy={6} r={2} />
          <Circle {...t} cx={10} cy={12} r={2} />
          <Circle {...t} cx={18} cy={18} r={2} />
        </>
      );
    case 'sair':
      return (
        <>
          <Path {...t} d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
          <Path {...t} d="M10 17l5-5-5-5M15 12H3" />
        </>
      );
    default:
      return <Rect x={4} y={4} width={16} height={16} rx={3} fill={cor} />;
  }
}
