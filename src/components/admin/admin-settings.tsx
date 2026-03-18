"use client";

import { useState } from "react";
import { buildFieldErrors, focusFirstInvalid, validateMatch, validateMinLength, validateRequired } from "@/lib/validation";
import { RequiredMark } from "@/components/admin/admin-form-helpers";
import ToastStack from "@/components/ui/toast-stack";

export default function AdminSettings() {
	const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
	const [message, setMessage] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [newPasswordValue, setNewPasswordValue] = useState("");
	const [toasts, setToasts] = useState<
		Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
	>([]);
	const [fieldErrors, setFieldErrors] = useState<{
		currentPassword?: string;
		newPassword?: string;
		confirmPassword?: string;
	}>({});
	const clearFieldError = (field: keyof typeof fieldErrors) => {
		setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
	};

	const pushToast = (message: string, type: "success" | "error" | "warning" | "primary") => {
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		setToasts((prev) => [...prev, { id, message, type }]);
	};

	const getStrength = (value: string) => {
		let score = 0;
		if (value.length >= 8) score += 1;
		if (value.length >= 12) score += 1;
		if (/[A-Z]/.test(value)) score += 1;
		if (/[0-9]/.test(value)) score += 1;
		if (/[^A-Za-z0-9]/.test(value)) score += 1;
		if (score <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-600" };
		if (score <= 3) return { label: "Okay", color: "bg-amber-500", text: "text-amber-600" };
		return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" };
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setStatus("saving");
		setMessage("");
		setFieldErrors({});

		const formData = new FormData(event.currentTarget);
		const currentPassword = String(formData.get("currentPassword") || "");
		const newPassword = String(formData.get("newPassword") || "");
		const confirmPassword = String(formData.get("confirmPassword") || "");

		const nextErrors = buildFieldErrors<"currentPassword" | "newPassword" | "confirmPassword">([
			{ key: "currentPassword", error: validateRequired(currentPassword, "Current password") },
			{ key: "newPassword", error: validateMinLength(newPassword, 8, "New password") },
			{
				key: "confirmPassword",
				error: validateMatch(confirmPassword, newPassword, "Confirmation", "new password"),
				message: "New password and confirmation do not match.",
			},
		]);

		if (Object.keys(nextErrors).length > 0) {
			setStatus("error");
			setMessage(Object.values(nextErrors)[0] ?? "Please fix the highlighted fields.");
			setFieldErrors(nextErrors);
			focusFirstInvalid(nextErrors, [
				{ key: "currentPassword", selector: 'input[name="currentPassword"]' },
				{ key: "newPassword", selector: 'input[name="newPassword"]' },
				{ key: "confirmPassword", selector: 'input[name="confirmPassword"]' },
			]);
			return;
		}

		try {
			const response = await fetch("/api/admin/password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentPassword, newPassword }),
			});
			if (!response.ok) {
				const data = (await response.json()) as { error?: string };
				setStatus("error");
				setMessage(data.error ?? "Unable to update password.");
				pushToast(data.error ?? "Unable to update password.", "error");
				return;
			}
			setStatus("success");
			setMessage("Password updated.");
			pushToast("Password updated successfully.", "success");
			event.currentTarget.reset();
		} catch {
			setStatus("error");
			setMessage("Unable to update password.");
			pushToast("Unable to update password.", "error");
		}
	};

	return (
		<div className="min-h-[calc(100vh-8rem)] bg-[var(--pp-white)] px-8 py-10">
			<div className="mx-auto w-full max-w-2xl">
				<h1 className="text-2xl font-[var(--font-heading)]">Settings</h1>
				<p className="mt-2 text-sm text-[var(--pp-muted)]">
					Update your admin password. Use a unique, strong password.
				</p>

				<form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
					<label className="grid gap-2 admin-label">
						Current password
						<RequiredMark />
						<div
							className={`flex items-center border bg-white px-4 py-2 ${
								fieldErrors.currentPassword ? "admin-input-error" : "border-[var(--pp-border)]"
							}`}
						>
							<input
								name="currentPassword"
								type={showCurrent ? "text" : "password"}
								className="w-full bg-transparent py-1 text-sm focus:outline-none"
								onChange={() => {
									if (fieldErrors.currentPassword) clearFieldError("currentPassword");
								}}
								onBlur={(event) => {
									if (!fieldErrors.currentPassword) return;
									const result = validateRequired(event.target.value, "Current password");
									if (!result) {
										setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
									}
								}}
							/>
							<button
								type="button"
								onClick={() => setShowCurrent((prev) => !prev)}
								className="flex h-8 w-8 items-center justify-center text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-gold)]"
								aria-label={showCurrent ? "Hide password" : "Show password"}
							>
								{showCurrent ? (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path d="M3 3l18 18" strokeWidth="1.6" strokeLinecap="round" />
										<path
											d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<path
											d="M9 5.2A9.6 9.6 0 0 1 12 5c5.2 0 9.5 4.2 10.5 7-0.4 1-1.4 2.8-3.2 4.4"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<path
											d="M6.2 7.1C4.2 8.6 2.8 10.6 1.5 12c1 2.8 5.3 7 10.5 7 1.1 0 2.1-0.2 3.1-0.6"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
									</svg>
								) : (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path
											d="M1.5 12c1-2.8 5.3-7 10.5-7s9.5 4.2 10.5 7c-1 2.8-5.3 7-10.5 7s-9.5-4.2-10.5-7z"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<circle cx="12" cy="12" r="3.2" strokeWidth="1.6" />
									</svg>
								)}
							</button>
						</div>
						<span
							data-show={Boolean(fieldErrors.currentPassword)}
							className="field-error text-xs normal-case text-red-600"
						>
							{fieldErrors.currentPassword ?? ""}
						</span>
					</label>
					<label className="grid gap-2 admin-label">
						New password
						<RequiredMark />
						<div
							className={`flex items-center border bg-white px-4 py-2 ${
								fieldErrors.newPassword ? "admin-input-error" : "border-[var(--pp-border)]"
							}`}
						>
							<input
								name="newPassword"
								type={showNew ? "text" : "password"}
								value={newPasswordValue}
								onChange={(event) => {
									setNewPasswordValue(event.target.value);
									if (fieldErrors.newPassword) clearFieldError("newPassword");
								}}
								onBlur={(event) => {
									if (!fieldErrors.newPassword) return;
									const result = validateMinLength(event.target.value, 8, "New password");
									if (!result) {
										setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
									}
								}}
								className="w-full bg-transparent py-1 pr-2 text-sm focus:outline-none"
							/>
							<button
								type="button"
								onClick={() => setShowNew((prev) => !prev)}
								className="flex h-8 w-8 items-center justify-center text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-gold)]"
								aria-label={showNew ? "Hide password" : "Show password"}
							>
								{showNew ? (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path d="M3 3l18 18" strokeWidth="1.6" strokeLinecap="round" />
										<path
											d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<path
											d="M9 5.2A9.6 9.6 0 0 1 12 5c5.2 0 9.5 4.2 10.5 7-0.4 1-1.4 2.8-3.2 4.4"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<path
											d="M6.2 7.1C4.2 8.6 2.8 10.6 1.5 12c1 2.8 5.3 7 10.5 7 1.1 0 2.1-0.2 3.1-0.6"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
									</svg>
								) : (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path
											d="M1.5 12c1-2.8 5.3-7 10.5-7s9.5 4.2 10.5 7c-1 2.8-5.3 7-10.5 7s-9.5-4.2-10.5-7z"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<circle cx="12" cy="12" r="3.2" strokeWidth="1.6" />
									</svg>
								)}
							</button>
						</div>
						<span
							data-show={Boolean(fieldErrors.newPassword)}
							className="field-error text-xs normal-case text-red-600"
						>
							{fieldErrors.newPassword ?? ""}
						</span>
						<div className="flex items-center gap-3">
							<div className="h-1 w-full bg-[var(--pp-border)]">
								<div className={`h-1 ${getStrength(newPasswordValue).color}`} style={{ width: `${Math.min(100, Math.max(10, newPasswordValue.length * 8))}%` }} />
							</div>
							<span className={`text-[10px] uppercase tracking-[0.2em] ${getStrength(newPasswordValue).text}`}>
								{newPasswordValue ? getStrength(newPasswordValue).label : "—"}
							</span>
						</div>
					</label>
					<label className="grid gap-2 admin-label">
						Confirm password
						<RequiredMark />
						<div
							className={`flex items-center border bg-white px-4 py-2 ${
								fieldErrors.confirmPassword ? "admin-input-error" : "border-[var(--pp-border)]"
							}`}
						>
							<input
								name="confirmPassword"
								type={showConfirm ? "text" : "password"}
								className="w-full bg-transparent py-1 pr-2 text-sm focus:outline-none"
								onChange={() => {
									if (fieldErrors.confirmPassword) clearFieldError("confirmPassword");
								}}
								onBlur={(event) => {
									if (!fieldErrors.confirmPassword) return;
									const result = validateMatch(
										event.target.value,
										newPasswordValue,
										"Confirmation",
										"new password"
									);
									if (!result) {
										setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
									}
								}}
							/>
							<button
								type="button"
								onClick={() => setShowConfirm((prev) => !prev)}
								className="flex h-8 w-8 items-center justify-center text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-gold)]"
								aria-label={showConfirm ? "Hide password" : "Show password"}
							>
								{showConfirm ? (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path d="M3 3l18 18" strokeWidth="1.6" strokeLinecap="round" />
										<path
											d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<path
											d="M9 5.2A9.6 9.6 0 0 1 12 5c5.2 0 9.5 4.2 10.5 7-0.4 1-1.4 2.8-3.2 4.4"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<path
											d="M6.2 7.1C4.2 8.6 2.8 10.6 1.5 12c1 2.8 5.3 7 10.5 7 1.1 0 2.1-0.2 3.1-0.6"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
									</svg>
								) : (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
										<path
											d="M1.5 12c1-2.8 5.3-7 10.5-7s9.5 4.2 10.5 7c-1 2.8-5.3 7-10.5 7s-9.5-4.2-10.5-7z"
											strokeWidth="1.6"
											strokeLinecap="round"
										/>
										<circle cx="12" cy="12" r="3.2" strokeWidth="1.6" />
									</svg>
								)}
							</button>
						</div>
						<span
							data-show={Boolean(fieldErrors.confirmPassword)}
							className="field-error text-xs normal-case text-red-600"
						>
							{fieldErrors.confirmPassword ?? ""}
						</span>
					</label>
					<button
						type="submit"
						className="btn-primary admin-btn admin-btn-size"
						disabled={status === "saving"}
					>
						<span className="admin-btn-label">
							{status === "saving" ? "Updating…" : "Update password"}
						</span>
					</button>
					{message && (
						<p className={`text-sm ${status === "error" ? "text-red-600" : "text-[var(--pp-muted)]"}`}>
							{message}
						</p>
					)}
				</form>
			</div>
			<ToastStack
				toasts={toasts}
				onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
			/>
		</div>
	);
}
