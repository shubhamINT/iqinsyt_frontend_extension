import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { AppState, AppAction } from '../shared/types.ts'

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <App />');
  return ctx;
}
