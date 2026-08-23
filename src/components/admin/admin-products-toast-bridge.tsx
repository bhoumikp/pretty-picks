"use client";

import { useContext, useEffect } from "react";
import type { ToastItem } from "@/components/ui/toast-stack";
import { ToastContext } from "@/components/admin/admin-toast-provider";

interface AdminProductsToastBridgeProps {
	onToastReady: (onToast: (toast: Omit<ToastItem, "id">) => void) => void;
}

export default function AdminProductsToastBridge({ onToastReady }: AdminProductsToastBridgeProps) {
	const context = useContext(ToastContext);

	useEffect(() => {
		if (!context) return;
		onToastReady((toast) => context.pushToast(toast));
	}, [context, onToastReady]);

	return null;
}
