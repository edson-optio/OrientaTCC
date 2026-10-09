/**
 * Contexto PROVISORIO de sessao.
 *
 * Guarda o usuario atual (id, nome e perfil) escolhido no seletor da tela de
 * entrada. Sera substituido pela sessao do Better Auth (UC11), que carregara o
 * usuario autenticado e as suas permissoes a partir da API.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type Perfil = 'aluno' | 'professor' | 'admin';

export interface Usuario {
  /** Id na tabela `usuarios` da API. */
  id: number;
  nome: string;
  perfil: Perfil;
}

/** Usuarios criados pelo seed da API (apps/api/src/db/seed.ts). */
export const USUARIOS_SEED: Record<Perfil, Usuario> = {
  admin: { id: 1, nome: 'Administrador', perfil: 'admin' },
  professor: { id: 2, nome: 'Profa. Ana Souza', perfil: 'professor' },
  aluno: { id: 3, nome: 'Carlos Lima', perfil: 'aluno' },
};

interface Sessao {
  usuario: Usuario | null;
  entrar: (usuario: Usuario) => void;
  sair: () => void;
}

const ContextoSessao = createContext<Sessao | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const entrar = useCallback((novo: Usuario) => setUsuario(novo), []);
  const sair = useCallback(() => setUsuario(null), []);

  const valor = useMemo<Sessao>(() => ({ usuario, entrar, sair }), [usuario, entrar, sair]);

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

/** Le a sessao atual. Deve ser usado dentro de SessaoProvider. */
export function useSessao(): Sessao {
  const sessao = useContext(ContextoSessao);
  if (!sessao) {
    throw new Error('useSessao deve ser usado dentro de SessaoProvider');
  }
  return sessao;
}
