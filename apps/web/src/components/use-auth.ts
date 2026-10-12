'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
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
    void api<User>('/auth/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  return { user, ready, setUser };
}
