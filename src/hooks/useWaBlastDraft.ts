import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

const prefix = "ajms-wa-draft-v1";

export function useWaBlastDraft<T>(userId: string | undefined, field: string, initial: T) {
  const key = userId ? `${prefix}:${userId}:${field}` : null;
  const initialRef = useRef(initial);
  const read = useCallback((): T => {
    if (!key) return initialRef.current;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initialRef.current : JSON.parse(raw) as T;
    } catch { return initialRef.current; }
  }, [key]);
  const [value, setValue] = useState<T>(read);
  const current = useRef(value);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    current.current = read();
    setValue(current.current);
  }, [read]);

  const update = useCallback((action: SetStateAction<T>) => {
    const next = typeof action === "function"
      ? (action as (previous: T) => T)(current.current) : action;
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(next));
        setStorageError(false);
      } catch { setStorageError(true); }
    }
    current.current = next;
    setValue(next);
  }, [key]);
  return [value, update, storageError] as const;
}

export function canSaveWaBlast(userId: string): boolean {
  try {
    const key = `${prefix}:${userId}:storage-check`;
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch { return false; }
}