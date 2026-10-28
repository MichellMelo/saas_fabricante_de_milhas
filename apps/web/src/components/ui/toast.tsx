"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };
type ToastApi = {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
};
const ToastContext = React.createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const push = React.useCallback((message: string, kind: ToastKind) => {
    const id = ++nextId.current;
    setItems((current) => [...current.slice(-3), { id, message, kind }]);
    window.setTimeout(
      () => setItems((current) => current.filter((item) => item.id !== id)),
      5000,
    );
  }, []);

  const api = React.useMemo(
    () => ({
      toast: {
        success: (message: string) => push(message, "success"),
        error: (message: string) => push(message, "error"),
        info: (message: string) => push(message, "info"),
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-label="Notificações"
        className="pointer-events-none fixed right-5 top-20 z-[200] flex w-[calc(100%-2.5rem)] max-w-md flex-col gap-3"
      >
        {items.map((item) => {
          const success = item.kind === "success";
          const error = item.kind === "error";
          const Icon = success ? CheckCircle2 : error ? AlertCircle : Info;
          const colors = success
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-blue-200 bg-blue-50 text-blue-800";
          return (
            <div
              key={item.id}
              className="pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <Alert
                role={error ? "alert" : "status"}
                className={"flex items-start gap-3 shadow-lg " + colors}
              >
                <Icon size={18} className="mt-0.5 shrink-0" />
                <AlertDescription className="flex-1">
                  {item.message}
                </AlertDescription>
                <button
                  onClick={() =>
                    setItems((current) =>
                      current.filter((entry) => entry.id !== item.id),
                    )
                  }
                  aria-label="Fechar notificação"
                  className="shrink-0 rounded-sm opacity-75 transition-opacity hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </Alert>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context)
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  return context;
}
