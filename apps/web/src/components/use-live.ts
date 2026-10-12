'use client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export function useLive<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void api<T>(path)
        .then((value) => {
          if (mounted) {
            setData(value);
            setError('');
          }
        })
        .catch((e) => {
          if (mounted) setError(e.message);
        });
    };
    refresh();
    const events = new EventSource(`/api${path}/events`);
    events.onmessage = (event) => {
      try {
        const value = JSON.parse(event.data);
        if (mounted && !value.unavailable) {
          setData(value);
          setError('');
        }
      } catch {}
    };
    const polling = setInterval(refresh, 10000);
    return () => {
      mounted = false;
      events.close();
      clearInterval(polling);
    };
  }, [path]);
  return { data, error };
}
