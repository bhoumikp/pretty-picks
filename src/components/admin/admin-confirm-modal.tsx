"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { BadgeCheck, Info, ShieldAlert, Skull, Star } from "lucide-react";

interface AdminConfirmModalProps {
	open: boolean;
	title: string;
	description?: string;
	status?: "success" | "danger" | "warning" | "primary" | "info";
	statusLabel?: string;
	destructive?: boolean;
	confirmLabel?: string;
	loadingLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	loading?: boolean;
	footer?: React.ReactNode;
}

export default function AdminConfirmModal({
	open,
	title,
	description,
	status = "primary",
	statusLabel,
	destructive = false,
	confirmLabel = "Confirm",
	loadingLabel = "Working…",
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
	loading = false,
	footer,
}: AdminConfirmModalProps) {
	const modalId = useId();
	const [mounted, setMounted] = useState(open);
	const [active, setActive] = useState(open);
	const effectiveStatus = destructive ? "danger" : status;
	const statusAccent: Record<NonNullable<AdminConfirmModalProps["status"]>, string> = {
		primary: "bg-[var(--pp-gold)]",
		success: "bg-emerald-500",
		danger: "bg-red-600",
		warning: "bg-amber-500",
		info: "bg-sky-500",
	};
	const statusDot: Record<NonNullable<AdminConfirmModalProps["status"]>, string> = {
		primary: "bg-[var(--pp-gold)]",
		success: "bg-emerald-500",
		danger: "bg-red-600",
		warning: "bg-amber-500",
		info: "bg-sky-500",
	};
	const confirmButtonClass =
		effectiveStatus === "primary"
			? "btn-primary admin-btn admin-btn-size"
			: `admin-btn admin-btn-size text-white ${
					effectiveStatus === "success"
						? "bg-emerald-600 hover:bg-emerald-700"
						: effectiveStatus === "danger"
							? "bg-red-600 hover:bg-red-700"
							: effectiveStatus === "warning"
								? "bg-amber-500 hover:bg-amber-600"
								: "bg-sky-600 hover:bg-sky-700"
				}`;
	const resolvedStatusLabel = useMemo(() => {
		if (statusLabel) return statusLabel;
		const label = effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1);
		return label;
	}, [effectiveStatus, statusLabel]);
	const StatusIcon = useMemo(() => {
		if (effectiveStatus === "success") return BadgeCheck;
		if (effectiveStatus === "warning") return ShieldAlert;
		if (effectiveStatus === "info") return Info;
		if (effectiveStatus === "danger") return Skull;
		return Star;
	}, [effectiveStatus]);
	const overlayClass = useMemo(
		() =>
			`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`,
		[active]
	);
	const modalClass = useMemo(
		() =>
			`w-full max-w-md bg-white rounded-lg shadow-lg transition-all duration-200 ${active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`,
		[active]
	);

	useEffect(() => {
		let openTimer: number | undefined;
		let openActiveTimer: number | undefined;
		let closeTimer: number | undefined;
		let unmountTimer: number | undefined;

		if (open) {
			if (!mounted) {
				openTimer = window.setTimeout(() => setMounted(true), 0);
			}
			openActiveTimer = window.setTimeout(() => setActive(true), 10);
		} else {
			closeTimer = window.setTimeout(() => setActive(false), 0);
			unmountTimer = window.setTimeout(() => setMounted(false), 200);
		}

		return () => {
			if (openTimer) window.clearTimeout(openTimer);
			if (openActiveTimer) window.clearTimeout(openActiveTimer);
			if (closeTimer) window.clearTimeout(closeTimer);
			if (unmountTimer) window.clearTimeout(unmountTimer);
		};
	}, [open, mounted]);

	useEffect(() => {
		if (!open) return;
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [open, onCancel]);

	useEffect(() => {
		if (!open) return;
		const event = new CustomEvent("pp-admin-modal-open", { detail: { id: modalId } });
		window.dispatchEvent(event);
	}, [open, modalId]);

	useEffect(() => {
		const handler = (event: Event) => {
			const custom = event as CustomEvent<{ id?: string }>;
			if (!open) return;
			if (custom.detail?.id && custom.detail.id !== modalId) {
				onCancel();
			}
		};
		window.addEventListener("pp-admin-modal-open", handler);
		return () => window.removeEventListener("pp-admin-modal-open", handler);
	}, [modalId, onCancel, open]);

	if (!mounted) return null;
	const titleId = "admin-confirm-title";
	const descriptionId = "admin-confirm-description";

	return (
		<div
			className={overlayClass}
			onClick={(event) => {
				if (event.target === event.currentTarget) onCancel();
			}}
		>
			<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
				<div
					className={modalClass}
					role="dialog"
					aria-modal="true"
					aria-labelledby={titleId}
					aria-describedby={description ? descriptionId : undefined}
				>
					<div className={`h-1 w-full ${statusAccent[effectiveStatus]}`} />
					<div className="border-b border-[var(--pp-border)] px-6 py-5">
						<div className="flex items-start justify-between gap-4">
							<div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">
								<span className={`h-2 w-2 rounded-full ${statusDot[effectiveStatus]}`} />
								<span>{resolvedStatusLabel}</span>
							</div>
							<button
								type="button"
								onClick={onCancel}
								className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
								aria-label="Close confirmation"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M6 6l12 12" strokeWidth="1.6" strokeLinecap="round" />
									<path d="M18 6l-12 12" strokeWidth="1.6" strokeLinecap="round" />
								</svg>
							</button>
						</div>
						<div className="mt-4 flex items-start gap-3">
							<span
								className={`flex h-10 w-10 items-center justify-center rounded-full ${statusAccent[effectiveStatus]} text-white`}
							>
								<StatusIcon className="h-5 w-5" />
							</span>
							<div>
								<h3 id={titleId} className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
									{title}
								</h3>
								{description && (
									<p id={descriptionId} className="mt-2 text-sm leading-relaxed text-[var(--pp-muted)]">
										{description}
									</p>
								)}
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/40 px-6 py-4">
						{footer ?? (
							<>
								<button type="button" className="btn-outline admin-btn admin-btn-size" onClick={onCancel}>
									{cancelLabel}
								</button>
								<button
									type="button"
									className={confirmButtonClass}
									onClick={onConfirm}
									disabled={loading}
								>
									{loading ? loadingLabel : confirmLabel}
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
