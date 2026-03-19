"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Check, Search } from "lucide-react";
import { buildFieldErrors, focusFirstInvalid, validateMatch, validateMinLength, validateRequired } from "@/lib/validation";
import { RequiredMark } from "@/components/admin/admin-form-helpers";
import ToastStack from "@/components/ui/toast-stack";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";

interface AdminSettingsProps {
	initialBranding: {
		storefrontLogoUrl: string;
		storefrontMobileLogoUrl: string;
		storefrontLogoAlt: string;
	};
	initialSettings: {
		launchDate: string | null;
		showCountdown: boolean;
	};
}

interface MediaLibraryItem {
	id: string;
	url: string;
	publicId?: string | null;
	format?: string | null;
	width?: number | null;
	height?: number | null;
	bytes?: number | null;
	createdAt?: string;
}

export default function AdminSettings({ initialBranding, initialSettings }: AdminSettingsProps) {
	const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
	const [message, setMessage] = useState("");
	const [brandingStatus, setBrandingStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
	const [brandingMessage, setBrandingMessage] = useState("");
	const [launchStatus, setLaunchStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
	const [launchMessage, setLaunchMessage] = useState("");
	const [showCurrent, setShowCurrent] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [newPasswordValue, setNewPasswordValue] = useState("");
	const [branding, setBranding] = useState(initialBranding);
	const [launchSettings, setLaunchSettings] = useState(initialSettings);
	const [brandingLibraryOpen, setBrandingLibraryOpen] = useState(false);
	const [brandingLibraryTarget, setBrandingLibraryTarget] = useState<"storefrontLogoUrl" | "storefrontMobileLogoUrl">(
		"storefrontLogoUrl"
	);
	const [brandingLibraryItems, setBrandingLibraryItems] = useState<MediaLibraryItem[]>([]);
	const [brandingLibraryLoading, setBrandingLibraryLoading] = useState(false);
	const [brandingLibraryQuery, setBrandingLibraryQuery] = useState("");
	const [brandingPreviewItem, setBrandingPreviewItem] = useState<MediaLibraryItem | null>(null);
	const [toasts, setToasts] = useState<
		Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
	>([]);
	const [fieldErrors, setFieldErrors] = useState<{
		currentPassword?: string;
		newPassword?: string;
		confirmPassword?: string;
	}>({});
	const [brandingErrors, setBrandingErrors] = useState<{
		storefrontLogoUrl?: string;
		storefrontMobileLogoUrl?: string;
		storefrontLogoAlt?: string;
	}>({});
	const clearFieldError = (field: keyof typeof fieldErrors) => {
		setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
	};
	const clearBrandingError = (field: keyof typeof brandingErrors) => {
		setBrandingErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
	};

	const pushToast = (message: string, type: "success" | "error" | "warning" | "primary") => {
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		setToasts((prev) => [...prev, { id, message, type }]);
	};

	const fetchBrandingLibraryItems = useCallback(async (query: string) => {
		setBrandingLibraryLoading(true);
		try {
			const params = new URLSearchParams({ page: "1", pageSize: "20" });
			if (query.trim()) params.set("q", query.trim());
			const response = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" });
			if (!response.ok) return;
			const data = (await response.json()) as { items?: MediaLibraryItem[] };
			setBrandingLibraryItems(data.items ?? []);
		} finally {
			setBrandingLibraryLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!brandingLibraryOpen) return;
		const timeout = window.setTimeout(() => {
			fetchBrandingLibraryItems(brandingLibraryQuery);
		}, 180);
		return () => window.clearTimeout(timeout);
	}, [brandingLibraryOpen, brandingLibraryQuery, fetchBrandingLibraryItems]);

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

	const handleBrandingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setBrandingStatus("saving");
		setBrandingMessage("");
		setBrandingErrors({});

		const nextErrors = buildFieldErrors<"storefrontLogoAlt">([
			{
				key: "storefrontLogoAlt",
				error:
					(branding.storefrontLogoUrl.trim() || branding.storefrontMobileLogoUrl.trim()) &&
					!branding.storefrontLogoAlt.trim()
						? { field: "Logo alt text", message: "Logo alt text is required when a logo is set." }
						: null,
			},
		]);

		if (Object.keys(nextErrors).length > 0) {
			setBrandingStatus("error");
			setBrandingMessage(Object.values(nextErrors)[0] ?? "Please fix the highlighted fields.");
			setBrandingErrors(nextErrors);
			focusFirstInvalid(nextErrors, [{ key: "storefrontLogoAlt", selector: "#storefront-logo-alt" }]);
			return;
		}

		try {
			const response = await fetch("/api/admin/site-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...branding,
					...launchSettings,
				}),
			});
			if (!response.ok) {
				const data = (await response.json()) as { error?: string };
				setBrandingStatus("error");
				setBrandingMessage(data.error ?? "Unable to update branding.");
				pushToast(data.error ?? "Unable to update branding.", "error");
				return;
			}

			const data = (await response.json()) as {
				storefrontLogoUrl: string | null;
				storefrontMobileLogoUrl: string | null;
				storefrontLogoAlt: string | null;
				launchDate: string | null;
				showCountdown: boolean;
			};
			setBranding({
				storefrontLogoUrl: data.storefrontLogoUrl ?? "",
				storefrontMobileLogoUrl: data.storefrontMobileLogoUrl ?? "",
				storefrontLogoAlt: data.storefrontLogoAlt ?? "",
			});
			setLaunchSettings({
				launchDate: data.launchDate,
				showCountdown: data.showCountdown,
			});
			setBrandingStatus("success");
			setBrandingMessage("Storefront branding updated.");
			pushToast("Storefront branding updated.", "success");
		} catch {
			setBrandingStatus("error");
			setBrandingMessage("Unable to update branding.");
			pushToast("Unable to update branding.", "error");
		}
	};

	const handleLaunchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLaunchStatus("saving");
		setLaunchMessage("");

		try {
			const response = await fetch("/api/admin/site-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...branding,
					...launchSettings,
				}),
			});
			if (!response.ok) {
				const data = (await response.json()) as { error?: string };
				setLaunchStatus("error");
				setLaunchMessage(data.error ?? "Unable to update launch settings.");
				pushToast(data.error ?? "Unable to update launch settings.", "error");
				return;
			}

			const data = (await response.json()) as {
				launchDate: string | null;
				showCountdown: boolean;
			};
			setLaunchSettings({
				launchDate: data.launchDate,
				showCountdown: data.showCountdown,
			});
			setLaunchStatus("success");
			setLaunchMessage("Launch settings updated.");
			pushToast("Launch settings updated.", "success");
		} catch {
			setLaunchStatus("error");
			setLaunchMessage("Unable to update launch settings.");
			pushToast("Unable to update launch settings.", "error");
		}
	};

	const openBrandingLibrary = (target: "storefrontLogoUrl" | "storefrontMobileLogoUrl") => {
		setBrandingLibraryTarget(target);
		setBrandingLibraryItems([]);
		setBrandingLibraryQuery("");
		setBrandingLibraryOpen(true);
	};

	const handleBrandingLibrarySelect = (item: MediaLibraryItem) => {
		setBranding((prev) => ({ ...prev, [brandingLibraryTarget]: item.url }));
		setBrandingLibraryOpen(false);
	};

	return (
		<div className="min-h-[calc(100vh-8rem)] bg-[var(--pp-white)] px-8 py-10">
			<div className="mx-auto w-full max-w-2xl">
				<h1 className="text-2xl font-[var(--font-heading)]">Settings</h1>
				<p className="mt-2 text-sm text-[var(--pp-muted)]">
					Manage storefront branding and keep admin access secure.
				</p>

				<form onSubmit={handleBrandingSubmit} className="mt-6 grid gap-4 border border-[var(--pp-border)] bg-white p-6" noValidate>
					<div>
						<h2 className="text-lg font-[var(--font-heading)]">Storefront branding</h2>
						<p className="mt-1 text-sm text-[var(--pp-muted)]">
							Choose separate desktop and mobile logos from Media Library, with automatic fallback to the text mark if nothing is set.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
							<div className="grid gap-2">
								<p className="admin-label">Logo preview</p>
								<div className="grid gap-3">
									<div className="grid gap-2">
										<p className="text-[11px] uppercase tracking-[0.18em] text-[var(--pp-muted)]">Desktop</p>
										<div className="flex min-h-[120px] items-center justify-center border border-[var(--pp-border)] bg-[var(--pp-beige)]/35 p-4">
										{branding.storefrontLogoUrl ? (
											<div className="relative h-16 w-full max-w-[180px]">
												<Image
													src={branding.storefrontLogoUrl}
													alt={branding.storefrontLogoAlt || "Storefront logo"}
													fill
													sizes="180px"
													className="object-contain"
												/>
											</div>
										) : (
											<span className="text-sm text-[var(--pp-muted)]">No desktop logo selected</span>
										)}
									</div>
									</div>
									<div className="grid gap-2">
										<p className="text-[11px] uppercase tracking-[0.18em] text-[var(--pp-muted)]">Mobile</p>
										<div className="mx-auto flex min-h-[92px] w-full max-w-[180px] items-center justify-center rounded-[1.1rem] border border-[var(--pp-border)] bg-[var(--pp-beige)]/35 p-4">
										{branding.storefrontMobileLogoUrl || branding.storefrontLogoUrl ? (
											<div className="relative h-12 w-full max-w-[140px]">
												<Image
													src={branding.storefrontMobileLogoUrl || branding.storefrontLogoUrl}
													alt={branding.storefrontLogoAlt || "Storefront mobile logo"}
													fill
													sizes="140px"
													className="object-contain"
												/>
											</div>
										) : (
											<span className="text-xs text-[var(--pp-muted)]">Mobile uses desktop logo by default</span>
										)}
									</div>
									</div>
								</div>
						</div>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<label className="admin-label">Desktop logo</label>
								<div className="flex flex-wrap items-center gap-3">
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => openBrandingLibrary("storefrontLogoUrl")}
									>
										<span className="admin-btn-label">Select from library</span>
									</button>
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => {
											setBranding((prev) => ({ ...prev, storefrontLogoUrl: "", storefrontMobileLogoUrl: "", storefrontLogoAlt: "" }));
											setBrandingErrors({});
										}}
									>
										Clear all
									</button>
								</div>
								<p className="text-xs text-[var(--pp-muted)]">
									Use a transparent PNG or WebP with a wide aspect ratio for best desktop results.
								</p>
							</div>
							<div className="grid gap-2">
								<label className="admin-label">Mobile logo</label>
								<div className="flex flex-wrap items-center gap-3">
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => openBrandingLibrary("storefrontMobileLogoUrl")}
									>
										<span className="admin-btn-label">Select from library</span>
									</button>
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => {
											setBranding((prev) => ({ ...prev, storefrontMobileLogoUrl: "" }));
											setBrandingErrors({});
										}}
									>
										Use desktop logo
									</button>
								</div>
								<p className="text-xs text-[var(--pp-muted)]">
									Optional. Leave empty to reuse the desktop logo on mobile.
								</p>
							</div>
							<div className="grid gap-2">
								<label htmlFor="storefront-logo-alt" className="admin-label">
									Logo alt text
									{branding.storefrontLogoUrl || branding.storefrontMobileLogoUrl ? <RequiredMark /> : null}
								</label>
								<input
									id="storefront-logo-alt"
									className={`admin-input ${brandingErrors.storefrontLogoAlt ? "is-error" : ""}`}
									value={branding.storefrontLogoAlt}
									onChange={(event) => {
										setBranding((prev) => ({ ...prev, storefrontLogoAlt: event.target.value }));
										if (brandingErrors.storefrontLogoAlt) clearBrandingError("storefrontLogoAlt");
									}}
									placeholder="Pretty Picks logo"
								/>
								<span
									data-show={Boolean(brandingErrors.storefrontLogoAlt)}
									className="field-error text-xs normal-case text-red-600"
								>
									{brandingErrors.storefrontLogoAlt ?? ""}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3">
						{brandingMessage ? (
							<p className={`text-sm ${brandingStatus === "error" ? "text-red-600" : "text-[var(--pp-muted)]"}`}>
								{brandingMessage}
							</p>
						) : (
							<span />
						)}
						<button
							type="submit"
							disabled={brandingStatus === "saving"}
							className="btn-primary admin-btn admin-btn-size"
						>
							<span className="admin-btn-label">
								{brandingStatus === "saving" ? "Saving..." : "Save branding"}
							</span>
						</button>
					</div>
				</form>
				{brandingLibraryOpen && (
					<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setBrandingLibraryOpen(false)}>
						<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
							<div
								className="w-full max-w-5xl rounded-lg bg-white shadow-lg"
								onClick={(event) => event.stopPropagation()}
							>
								<div className="border-b border-[var(--pp-border)] px-6 py-3">
									<div className="flex flex-wrap items-center justify-between gap-4">
										<div>
											<p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Library</p>
											<h3 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
												Select {brandingLibraryTarget === "storefrontLogoUrl" ? "desktop" : "mobile"} logo
											</h3>
										</div>
										<div className="relative w-full sm:max-w-xs">
											<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pp-muted)]" />
											<input
												value={brandingLibraryQuery}
												onChange={(event) => setBrandingLibraryQuery(event.target.value)}
												placeholder="Search media"
												className="admin-input h-10 pl-9"
											/>
										</div>
									</div>
								</div>
								<div className="max-h-[60vh] overflow-y-auto p-6">
									{brandingLibraryLoading ? (
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
											{Array.from({ length: 10 }).map((_, idx) => (
												<div key={idx} className="h-40 animate-pulse rounded-sm bg-[var(--pp-beige)]/40" />
											))}
										</div>
									) : brandingLibraryItems.length === 0 ? (
										<div className="py-12 text-center text-sm text-[var(--pp-muted)]">No media found.</div>
									) : (
										<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
											{brandingLibraryItems.map((item) => {
												const activeUrl = branding[brandingLibraryTarget];
												const selected = activeUrl === item.url;
												return (
													<div
														key={item.id}
														className={`group relative cursor-pointer border ${
															selected ? "border-[4px] border-[var(--pp-gold)]" : "border-[var(--pp-border)]"
														}`}
														role="button"
														tabIndex={0}
														onClick={() => handleBrandingLibrarySelect(item)}
														onKeyDown={(event) => {
															if (event.key !== "Enter" && event.key !== " ") return;
															event.preventDefault();
															handleBrandingLibrarySelect(item);
														}}
													>
														<div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--pp-beige)]/40">
															<Image
																src={item.url}
																alt="Media"
																fill
																sizes="(max-width: 640px) 100vw, 200px"
																className="object-cover"
															/>
														</div>
														{selected ? (
															<span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pp-gold)] text-[var(--pp-ink)]">
																<Check className="h-4 w-4" />
															</span>
														) : null}
														<button
															type="button"
															className="admin-tooltip-trigger absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-sm border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 hover:border-sky-200/70 hover:text-sky-50 hover:shadow-[0_0_0_2px_rgba(56,189,248,0.25)] group-hover:opacity-100 group-focus-within:opacity-100"
															onClick={(event) => {
																event.stopPropagation();
																setBrandingPreviewItem(item);
															}}
															aria-label="Preview"
														>
															<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
																<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" strokeWidth="1.6" strokeLinecap="round" />
																<circle cx="12" cy="12" r="3" strokeWidth="1.6" />
															</svg>
															<span className="admin-tooltip admin-tooltip--info">View</span>
														</button>
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
				<AdminMediaViewer
					open={Boolean(brandingPreviewItem)}
					item={
						brandingPreviewItem
							? {
									url: brandingPreviewItem.url,
									title: "Logo preview",
									format: brandingPreviewItem.format,
									width: brandingPreviewItem.width,
									height: brandingPreviewItem.height,
									bytes: brandingPreviewItem.bytes,
									createdAt: brandingPreviewItem.createdAt ?? null,
								}
							: null
					}
					onClose={() => setBrandingPreviewItem(null)}
				/>

				{/* ── Launch Countdown ── */}
				<form onSubmit={handleLaunchSubmit} className="mt-8 grid gap-4 border border-[var(--pp-border)] bg-white p-6">
					<div>
						<h2 className="text-lg font-[var(--font-heading)]">Launch countdown</h2>
						<p className="mt-1 text-sm text-[var(--pp-muted)]">
							Enable and set a target date for the storefront launch countdown timer.
						</p>
					</div>

					<div className="grid gap-6">
						<div className="flex items-center justify-between py-2">
							<div className="grid gap-0.5">
								<label htmlFor="show-countdown" className="admin-label cursor-pointer">
									Show countdown on homepage
								</label>
								<p className="text-xs text-[var(--pp-muted)]">
									Enable this to display the animated timer to visitors.
								</p>
							</div>
							<button
								type="button"
								id="show-countdown"
								onClick={() => setLaunchSettings((prev) => ({ ...prev, showCountdown: !prev.showCountdown }))}
								className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
									launchSettings.showCountdown ? "bg-[var(--pp-gold)]" : "bg-[var(--pp-border)]"
								}`}
							>
								<span
									className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
										launchSettings.showCountdown ? "translate-x-5" : "translate-x-0"
									}`}
								/>
							</button>
						</div>

						<div className="grid gap-2">
							<label htmlFor="launch-date" className="admin-label">
								Launch date & time (IST)
							</label>
							<input
								id="launch-date"
								type="datetime-local"
								className="admin-input"
								value={
									launchSettings.launchDate
										? new Date(
												new Date(launchSettings.launchDate).getTime() -
													new Date(launchSettings.launchDate).getTimezoneOffset() * 60000
											)
												.toISOString()
												.slice(0, 16)
										: ""
								}
								onChange={(e) => {
									const val = e.target.value;
									setLaunchSettings((prev) => ({ ...prev, launchDate: val ? new Date(val).toISOString() : null }));
								}}
							/>
							<p className="text-xs text-[var(--pp-muted)]">
								The countdown will tick down to this specific moment. Use your local time.
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
						{launchMessage ? (
							<p className={`text-sm ${launchStatus === "error" ? "text-red-600" : "text-[var(--pp-muted)]"}`}>
								{launchMessage}
							</p>
						) : (
							<span />
						)}
						<button
							type="submit"
							disabled={launchStatus === "saving"}
							className="btn-primary admin-btn admin-btn-size"
						>
							<span className="admin-btn-label">
								{launchStatus === "saving" ? "Saving..." : "Update settings"}
							</span>
						</button>
					</div>
				</form>

				<form onSubmit={handleSubmit} className="mt-8 grid gap-4" noValidate>
					<div>
						<h2 className="text-lg font-[var(--font-heading)]">Security</h2>
						<p className="mt-1 text-sm text-[var(--pp-muted)]">
							Update your admin password. Use a unique, strong password.
						</p>
					</div>
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
