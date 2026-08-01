'use client';

import { createContext, useCallback, useState, type ReactNode } from 'react';

interface ToastEntry {
  id: number;
  message: string;
  type: 'info' | 'error';
  leaving?: boolean;
}

export interface ToastContextValue {
  toast: (message: string, type?: 'info' | 'error') => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const toast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Flag as leaving so the fade-out plays, then remove once it has run.
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, 3000);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3350);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-[80px] left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`${t.leaving ? 'hearth-fade-out' : 'hearth-fade-in'} rounded-[10px] border border-border-subtle bg-surface-panel px-lg py-sm font-sans text-sm shadow-float ${
                t.type === 'error' ? 'text-red-400' : 'text-text-secondary'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
