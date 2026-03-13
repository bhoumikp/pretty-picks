"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  durationMs?: number;
  onClose: () => void;
}

export default function Toast({ message, type = "success", durationMs = 2500, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[280px] border border-[var(--pp-border)] bg-white shadow-xl ${
        type === "error" ? "border-red-400" : "border-[var(--pp-gold)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <p className={`text-sm ${type === "error" ? "text-red-600" : "text-[var(--pp-ink)]"}`}>
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
          className={`h-0.5 ${type === "error" ? "bg-red-500" : "bg-[var(--pp-gold)]"} toast-progress`}
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  );
}
