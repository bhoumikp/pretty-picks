"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import ToastStack, { type ToastItem } from "@/components/ui/toast-stack";

export interface ToastContextValue {
	pushToast: (toast: Omit<ToastItem, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

interface AdminToastProviderProps {
	children: ReactNode;
}

export default function AdminToastProvider({ children }: AdminToastProviderProps) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		setToasts((prev) => [...prev, { id, ...toast }]);
	}, []);

	const value = useMemo(() => ({ pushToast }), [pushToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
		</ToastContext.Provider>
	);
}
