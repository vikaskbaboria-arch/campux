import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    classes: 'border-orange-300/20 bg-[#211512] text-orange-50',
    iconClasses: 'text-[#fb9a74]',
  },
  error: {
    icon: AlertCircle,
    classes: 'border-red-500/20 bg-[#1a1011] text-red-100',
    iconClasses: 'text-red-400',
  },
  info: {
    icon: Info,
    classes: 'border-white/10 bg-[#111113] text-zinc-100',
    iconClasses: 'text-zinc-300',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    if (!message) return;
    const id = ++nextId.current;
    const toastType = toastStyles[type] ? type : 'info';
    setToasts((current) => [...current, { id, message, type: toastType }]);
    timers.current.set(id, window.setTimeout(() => dismissToast(id), 4200));
  }, [dismissToast]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-top-2 ${style.classes}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClasses}`} />
              <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="-mr-1 -mt-1 rounded-full p-1 text-zinc-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
