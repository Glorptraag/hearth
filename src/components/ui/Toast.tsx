'use client';

import { createContext, useCallback, useState, type ReactNode } from 'react';

interface ToastEntry {
  id: number;
  message: string;
  type: 'info' | 'error';
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
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-[80px] left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-[10px] border border-border-subtle bg-surface-panel px-lg py-sm font-sans text-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${
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
