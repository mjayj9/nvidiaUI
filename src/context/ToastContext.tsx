import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  toast: (message: string, type?: ToastType) => void; // alias for convenience
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastAlias = useCallback((message: string, type?: ToastType) => {
    showToast(message, type);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toast: toastAlias }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          let borderClass = "border-neutral-800";
          let icon = <Info className="w-4 h-4 text-blue-400" />;
          
          if (t.type === "success") {
            borderClass = "border-[#76b900]/50 shadow-[0_0_15px_rgba(118,185,0,0.15)]";
            icon = <CheckCircle className="w-4 h-4 text-[#76b900]" />;
          } else if (t.type === "error") {
            borderClass = "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
            icon = <AlertCircle className="w-4 h-4 text-red-400" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 bg-neutral-950/95 border ${borderClass} rounded-xl text-neutral-100 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300 transition-all`}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-xs font-semibold leading-relaxed tracking-wide">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5 rounded-lg hover:bg-neutral-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
