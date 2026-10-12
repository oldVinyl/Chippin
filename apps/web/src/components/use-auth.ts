'use client';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
export type User = {
  id: string;
  name: string;
  email: string;
  verified: string;
  phoneVerified: boolean;
  isAdmin: boolean;
  csrf: string;
};
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function load() {
      for (let attempt = 0; attempt < 4 && mounted; attempt++) {
        try {
          const result = await api<User>('/auth/me');
          if (mounted) {
            setUser(result);
            setReady(true);
          }
          return;
        } catch (error) {
          if (error instanceof ApiError && [401, 403].includes(error.status)) {
            if (mounted) setReady(true);
            return;
          }
          if (attempt < 3)
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * 2 ** attempt),
            );
        }
      }
      if (mounted) setReady(true);
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);
  return { user, ready, setUser };
}
