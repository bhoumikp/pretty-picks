"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "primary";
  durationMs?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  durationMs = 2500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div
      className={`w-[280px] border bg-white shadow-xl ${
        type === "error"
          ? "border-red-300"
          : type === "warning"
          ? "border-amber-300"
          : type === "primary"
          ? "border-[var(--pp-gold)] bg-[var(--pp-gold)]/10"
          : "border-emerald-300"
      }`}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <p
          className={`text-sm ${
            type === "error"
              ? "text-red-600"
              : type === "warning"
              ? "text-amber-700"
              : type === "primary"
              ? "text-[var(--pp-ink)]"
              : "text-emerald-700"
          }`}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-ink)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 6L18 18" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M18 6L6 18" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="h-0.5 w-full bg-[var(--pp-border)]">
        <div
          className={`h-0.5 toast-progress ${
            type === "error"
              ? "bg-red-500"
              : type === "warning"
              ? "bg-amber-500"
              : type === "primary"
              ? "bg-[var(--pp-gold)]"
              : "bg-emerald-500"
          }`}
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  );
}
