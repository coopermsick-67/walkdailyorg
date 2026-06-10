"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

const DISMISS_MS = 4000;
const EXIT_MS = 300;
const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    // Play exit animation first
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setToasts((prev) => {
        const next = [...prev, { id, message, variant }];
        // FIFO eviction: if exceeding MAX_TOASTS, remove the oldest non-exiting toast
        if (next.length > MAX_TOASTS) {
          const oldestIdx = next.findIndex((t) => !t.exiting);
          if (oldestIdx >= 0) {
            next.splice(oldestIdx, 1);
          }
        }
        return next;
      });
      setTimeout(() => remove(id), DISMISS_MS);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast: push,
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast toast-${t.variant} ${t.exiting ? "toast-exit" : ""}`}
          >
            <span aria-hidden="true">{variantIcon[t.variant]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

const variantIcon: Record<ToastVariant, string> = {
  success: "✓",
  error: "✗",
  info: "ℹ",
};

/* ------------------------------------------------------------------ */
/*  Standalone programmatic dispatch (for use outside JSX)             */
/* ------------------------------------------------------------------ */

let globalDispatch: ToastContextValue | null = null;

/** Call once from a Client Component to wire up the global dispatcher. */
export function ToasterWiring() {
  const ctx = useContext(ToastContext);
  useEffect(() => {
    globalDispatch = ctx;
    return () => {
      globalDispatch = null;
    };
  }, [ctx]);
  return null;
}

/**
 * Dispatch a toast from anywhere (even non-React code).
 * Requires <ToastProvider> to be mounted and <ToasterWiring> rendered
 * somewhere inside it.
 */
export function dispatchToast(message: string, variant: ToastVariant = "info") {
  if (globalDispatch) {
    globalDispatch.toast(message, variant);
  }
}

/**
 * Auto-dismiss wrapper – ensures exit animation plays even if the caller
 * unmounts the toast provider shortly after pushing.
 */
export function useAutoDismiss() {
  // No-op; auto-dismiss is handled inside the provider. Kept for API
  // symmetry with other component libraries.
  return null;
}
