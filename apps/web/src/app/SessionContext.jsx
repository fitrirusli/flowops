import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, initializeCsrf } from '../lib/api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('flowops:organization'));
  const [notice, setNotice] = useState('');
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return (await api('/api/v1/me')).data;
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  const user = session.data;
  const organization =
    user?.organizations.find((item) => item.id === selectedId) || user?.organizations[0];

  useEffect(() => {
    const expire = () => {
      client.cancelQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      client.setQueryData(['session'], null);
      setNotice('Your session expired. Sign in again to continue.');
    };
    window.addEventListener('flowops:session-expired', expire);
    return () => window.removeEventListener('flowops:session-expired', expire);
  }, [client]);

  async function login(email, password) {
    await initializeCsrf();
    const result = await api('/login', { method: 'POST', body: { email, password } });
    await client.cancelQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    client.setQueryData(['session'], result.data);
    setNotice('');
  }

  async function logout() {
    await api('/logout', { method: 'POST' });
    await client.cancelQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    client.setQueryData(['session'], null);
  }

  async function selectOrganization(id) {
    await client.cancelQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
    setSelectedId(id);
    localStorage.setItem('flowops:organization', id);
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        organization,
        loading: session.isPending,
        error: session.error,
        login,
        logout,
        selectOrganization,
        notice,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
