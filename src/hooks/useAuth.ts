// TODO: Re-enable auth when backend is ready
// import { getAccessToken, clearTokens } from '../auth/tokenManager.ts'
// import { fetchUserPlan } from '../api/client.ts'
import { useEffect } from 'react'
import { useAppContext } from '../sidepanel/context.tsx'

export function useAuth() {
  const { state, dispatch } = useAppContext();

  /* 
  useEffect(() => {
    async function checkAuth() {
      const token = await getAccessToken();
      if (!token) {
        dispatch({ type: 'AUTH_REQUIRED' });
        return;
      }
      try {
        const { plan } = await fetchUserPlan();
        dispatch({ type: 'SET_USER', payload: { isAuthenticated: true, plan } });
      } catch {
        dispatch({ type: 'AUTH_REQUIRED' });
      }
    }
    checkAuth();
  }, [dispatch]);
  */

  // Dev mode: assume authenticated
  useEffect(() => {
    dispatch({ type: 'SET_USER', payload: { isAuthenticated: true, plan: 'free' } });
  }, [dispatch]);

  /*
  async function logout() {
    await clearTokens();
    dispatch({ type: 'AUTH_REQUIRED' });
  }
  */

  return { isAuthenticated: state.user.isAuthenticated, logout: () => {} };
}
