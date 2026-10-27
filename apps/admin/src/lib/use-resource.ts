import { useCallback, useEffect, useState } from 'react';
import { api, messageOf } from './api';

export function useResource<T>(path: string | null) {
  const [revision, setRevision] = useState(0);
  const key = `${path}:${revision}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    void api<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ key, error: messageOf(error) });
    });
    return () => controller.abort();
  }, [path, key]);
  const current = result?.key === key ? result : null;
  const reload = useCallback(() => setRevision(value => value + 1), []);
  return { data: current?.data, error: current?.error, loading: path !== null && current === null, reload };
}
