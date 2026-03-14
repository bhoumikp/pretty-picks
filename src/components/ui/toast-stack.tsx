"use client";

import Toast from "@/components/ui/toast";

export interface ToastItem {
  id: string;
  message: string;
  type?: "success" | "error" | "warning" | "primary";
  durationMs?: number;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export default function ToastStack({ toasts, onClose }: ToastStackProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-6 left-1/2 z-50 flex w-full max-w-[320px] -translate-x-1/2 flex-col gap-3 px-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          durationMs={toast.durationMs}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}
