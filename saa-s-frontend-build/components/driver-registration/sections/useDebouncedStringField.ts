'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY_MS = 150;

export function useDebouncedStringField(
  committed: string,
  commit: (next: string) => void,
  delayMs = DEFAULT_DELAY_MS,
) {
  const [local, setLocal] = useState(committed);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(committed);

  useEffect(() => {
    setLocal(committed);
    latestRef.current = committed;
  }, [committed]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    commit(latestRef.current);
  }, [commit]);

  const onChangeValue = useCallback(
    (next: string) => {
      setLocal(next);
      latestRef.current = next;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        commit(latestRef.current);
      }, delayMs);
    },
    [commit, delayMs],
  );

  const onBlur = useCallback(() => {
    flush();
  }, [flush]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { value: local, onChangeValue, onBlur };
}
