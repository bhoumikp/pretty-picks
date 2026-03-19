"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Search } from "lucide-react";
import ToastStack from "@/components/ui/toast-stack";
import { RequiredMark } from "./admin-form-helpers";
import AdminMediaViewer from "./admin-media-viewer";
import { buildFieldErrors, focusFirstInvalid, validateRequired } from "@/lib/validation";

interface BannerFormValues {
	id?: string;
	eyebrow: string;
	title: string;
	subtitle: string;
	image: string;
	mobileImage: string;
	link: string;
	ctaLabel: string;
	priority: string;
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

interface AdminBannerFormProps {
	mode: "create" | "edit";
	initialValues?: BannerFormValues;
}

const emptyForm: BannerFormValues = {
	eyebrow: "Pretty Picks",
	title: "",
	subtitle: "",
	image: "",
	mobileImage: "",
	link: "",
	ctaLabel: "",
	priority: "0",
};

export default function AdminBannerForm({ mode, initialValues }: AdminBannerFormProps) {
	const router = useRouter();
	const [form, setForm] = useState<BannerFormValues>(initialValues ?? emptyForm);
	const [saving, setSaving] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: "success" | "error" }>>([]);
	const [libraryOpen, setLibraryOpen] = useState(false);
	const [libraryTarget, setLibraryTarget] = useState<"image" | "mobileImage">("image");
	const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([]);
	const [libraryLoading, setLibraryLoading] = useState(false);
	const [libraryQuery, setLibraryQuery] = useState("");
	const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);

	const fetchLibraryItems = useCallback(async (query: string) => {
		setLibraryLoading(true);
		try {
			const params = new URLSearchParams({ page: "1", pageSize: "20" });
			if (query.trim()) params.set("q", query.trim());
			const response = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" });
			if (!response.ok) return;
			const data = (await response.json()) as { items?: MediaLibraryItem[] };
			setLibraryItems(data.items ?? []);
		} finally {
			setLibraryLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!libraryOpen) return;
		const timeout = window.setTimeout(() => {
			fetchLibraryItems(libraryQuery);
		}, 180);
		return () => window.clearTimeout(timeout);
	}, [fetchLibraryItems, libraryOpen, libraryQuery]);

	const openLibrary = (target: "image" | "mobileImage") => {
		setLibraryTarget(target);
		setLibraryQuery("");
		setLibraryItems([]);
		setLibraryOpen(true);
	};

	const handleLibrarySelect = (item: MediaLibraryItem) => {
		setForm((prev) => ({ ...prev, [libraryTarget]: item.url }));
		if (libraryTarget === "image" && fieldErrors.image) {
			setFieldErrors((prev) => {
				const { image: _, ...rest } = prev;
				return rest;
			});
		}
		setLibraryOpen(false);
	};

	const pushToast = (message: string, type: "success" | "error") => {
		setToasts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, message, type }]);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setSaving(true);
		setFieldErrors({});

		const errors = buildFieldErrors([
			{ key: "title", error: validateRequired(form.title, "Title") },
			{ key: "image", error: validateRequired(form.image, "Image") },
		]);

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			focusFirstInvalid(errors, [
				{ key: "title", selector: "#banner-title" },
				{ key: "image", selector: "#banner-image" },
			]);
			setSaving(false);
			return;
		}

		const response = await fetch(mode === "edit" && form.id ? `/api/admin/banners/${form.id}` : "/api/admin/banners", {
			method: mode === "edit" ? "PATCH" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...form,
				priority: parseInt(form.priority, 10) || 0,
			}),
		});

		if (!response.ok) {
			pushToast(`Failed to ${mode === "edit" ? "update" : "create"} banner.`, "error");
			setSaving(false);
			return;
		}

		pushToast(`Banner ${mode === "edit" ? "updated" : "created"} successfully.`, "success");
		setTimeout(() => {
			router.push("/admin/banners");
			router.refresh();
		}, 500);
	};

	const previewEyebrow = useMemo(() => form.eyebrow.trim() || "Pretty Picks", [form.eyebrow]);
	const previewTitle = useMemo(() => form.title.trim() || "Your next hero headline", [form.title]);
	const previewSubtitle = useMemo(
		() => form.subtitle.trim() || "Use a short supporting line to frame the collection, drop, or campaign.",
		[form.subtitle]
	);
	const previewCta = useMemo(() => form.ctaLabel.trim() || "Shop Collection", [form.ctaLabel]);
	const previewImage = useMemo(() => form.image.trim() || "/images/hero.svg", [form.image]);
	const previewMobileImage = useMemo(() => form.mobileImage.trim() || previewImage, [form.mobileImage, previewImage]);

	return (
		<div className="grid gap-6">
			<ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
			<div className="sticky top-0 z-20 -mx-4 border-b border-[var(--pp-border)] bg-[var(--pp-white)]/92 px-4 py-4 backdrop-blur md:-mx-6 md:px-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Storefront</p>
						<h1 className="text-2xl font-[var(--font-heading)]">{mode === "edit" ? "Edit banner" : "Add banner"}</h1>
						<p className="mt-1 text-sm text-[var(--pp-muted)]">
							Build the hero banner on a dedicated page so composition and preview have room to breathe.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Link href="/admin/banners" className="btn-outline admin-btn admin-btn-size">
							<ArrowLeft className="h-4 w-4" />
							<span className="admin-btn-label">Back to banners</span>
						</Link>
						<button type="submit" form="admin-banner-form" disabled={saving} className="btn-primary admin-btn admin-btn-size px-8">
							<span className="admin-btn-label">{saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save banner"}</span>
						</button>
					</div>
				</div>
			</div>

			<form id="admin-banner-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
				<div className="grid gap-5">
					<div className="grid gap-2 rounded-lg border border-[var(--pp-border)] bg-[var(--pp-beige)]/25 p-4 text-sm text-[var(--pp-muted)]">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--pp-ink)]">Composition guide</p>
						<p>Keep the headline short and high-contrast. The left third is the safest copy area on desktop.</p>
						<p>Use a dedicated mobile image when the desktop crop feels too wide or cuts jewellery details.</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label className="text-sm font-medium">Title<RequiredMark /></label>
							<input
								id="banner-title"
								className={`admin-input ${fieldErrors.title ? "border-red-500" : ""}`}
								value={form.title}
								onChange={(e) => setForm({ ...form, title: e.target.value })}
								placeholder="e.g. New Arrivals"
							/>
							{fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
						</div>

						<div className="grid gap-2">
							<label className="text-sm font-medium">Eyebrow</label>
							<input
								className="admin-input"
								value={form.eyebrow}
								onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
								placeholder="e.g. Pretty Picks"
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">Subtitle</label>
						<textarea
							className="admin-textarea min-h-24"
							value={form.subtitle}
							onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
							placeholder="e.g. Explore our latest collection"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label className="text-sm font-medium">Primary CTA label</label>
							<input
								className="admin-input"
								value={form.ctaLabel}
								onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
								placeholder="e.g. Shop Collection"
							/>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium">Link URL</label>
							<input
								className="admin-input"
								value={form.link}
								onChange={(e) => setForm({ ...form, link: e.target.value })}
								placeholder="/products"
							/>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label className="text-sm font-medium">Desktop image<RequiredMark /></label>
							<div
								id="banner-image"
								className={`grid gap-3 rounded-lg border bg-[var(--pp-beige)]/20 p-3 ${
									fieldErrors.image ? "border-red-500" : "border-[var(--pp-border)]"
								}`}
							>
								<div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-[var(--pp-border)] bg-[var(--pp-beige)]/35">
									{form.image ? (
										<Image src={form.image} alt="Desktop banner preview" fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
									) : (
										<div className="flex h-full items-center justify-center text-sm text-[var(--pp-muted)]">No desktop image selected</div>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<button type="button" className="btn-outline admin-btn admin-btn-size" onClick={() => openLibrary("image")}>
										<span className="admin-btn-label">Select from library</span>
									</button>
									{form.image ? (
										<button type="button" className="btn-outline admin-btn admin-btn-size" onClick={() => setForm((prev) => ({ ...prev, image: "" }))}>
											<span className="admin-btn-label">Clear</span>
										</button>
									) : null}
								</div>
							</div>
							{fieldErrors.image && <p className="text-xs text-red-500">{fieldErrors.image}</p>}
						</div>

						<div className="grid gap-2">
							<label className="text-sm font-medium">Mobile image</label>
							<div className="grid gap-3 rounded-lg border border-[var(--pp-border)] bg-[var(--pp-beige)]/20 p-3">
								<div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-[var(--pp-border)] bg-[var(--pp-beige)]/35">
									{form.mobileImage ? (
										<Image src={form.mobileImage} alt="Mobile banner preview" fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
									) : (
										<div className="flex h-full items-center justify-center text-sm text-[var(--pp-muted)]">Uses desktop image by default</div>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<button type="button" className="btn-outline admin-btn admin-btn-size" onClick={() => openLibrary("mobileImage")}>
										<span className="admin-btn-label">Select from library</span>
									</button>
									<button type="button" className="btn-outline admin-btn admin-btn-size" onClick={() => setForm((prev) => ({ ...prev, mobileImage: "" }))}>
										<span className="admin-btn-label">Use desktop image</span>
									</button>
								</div>
							</div>
							<p className="text-xs text-[var(--pp-muted)]">Leave empty to reuse the desktop image.</p>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label className="text-sm font-medium">Priority</label>
							<input
								type="number"
								className="admin-input"
								value={form.priority}
								onChange={(e) => setForm({ ...form, priority: e.target.value })}
							/>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Link href="/admin/banners" className="btn-secondary admin-btn admin-btn-size px-6">
							<span className="admin-btn-label">Cancel</span>
						</Link>
						<button type="submit" disabled={saving} className="btn-primary admin-btn admin-btn-size px-8 lg:hidden">
							<span className="admin-btn-label">{saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save banner"}</span>
						</button>
					</div>
				</div>

				<div className="grid gap-4 rounded-lg border border-[var(--pp-border)] bg-white p-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Live preview</p>
						<h2 className="mt-1 text-lg font-[var(--font-heading)] text-[var(--pp-ink)]">Storefront hero</h2>
					</div>

					<div className="grid gap-4">
						<div className="overflow-hidden rounded-lg border border-[var(--pp-border)] bg-[var(--pp-beige)]/30">
							<div className="border-b border-[var(--pp-border)] px-4 py-3">
								<p className="text-[10px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Desktop</p>
							</div>
							<div className="relative aspect-[16/10]">
								<Image src={previewImage} alt="Desktop banner preview" fill sizes="360px" className="object-cover" />
								<div className="absolute inset-0 bg-gradient-to-r from-[rgba(31,27,24,0.78)] via-[rgba(31,27,24,0.42)] to-transparent" />
								<div className="absolute inset-y-0 left-0 flex max-w-[72%] flex-col justify-center gap-3 px-5 py-6 text-white">
									<p className="text-[10px] uppercase tracking-[0.28em] text-white/70">{previewEyebrow}</p>
									<h3 className="font-[var(--font-heading)] text-2xl leading-tight">{previewTitle}</h3>
									<p className="max-w-[28ch] text-sm text-white/80">{previewSubtitle}</p>
									<span className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
										{previewCta}
									</span>
								</div>
							</div>
						</div>

						<div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[1.75rem] border border-[var(--pp-border)] bg-[var(--pp-beige)]/30">
							<div className="border-b border-[var(--pp-border)] px-4 py-3">
								<p className="text-[10px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Mobile</p>
							</div>
							<div className="relative aspect-[4/5]">
								<Image src={previewMobileImage} alt="Mobile banner preview" fill sizes="240px" className="object-cover" />
								<div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,27,24,0.72)] via-[rgba(31,27,24,0.24)] to-transparent" />
								<div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-4 py-5 text-white">
									<p className="text-[10px] uppercase tracking-[0.26em] text-white/70">{previewEyebrow}</p>
									<h3 className="font-[var(--font-heading)] text-xl leading-tight">{previewTitle}</h3>
									<p className="text-xs text-white/80">{previewSubtitle}</p>
									<span className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
										{previewCta}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</form>

			{libraryOpen && (
				<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setLibraryOpen(false)}>
					<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
						<div className="w-full max-w-5xl rounded-lg bg-white shadow-lg" onClick={(event) => event.stopPropagation()}>
							<div className="border-b border-[var(--pp-border)] px-6 py-3">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div>
										<p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Library</p>
										<h3 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
											Select {libraryTarget === "image" ? "desktop" : "mobile"} banner image
										</h3>
									</div>
									<div className="relative w-full sm:max-w-xs">
										<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pp-muted)]" />
										<input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search media" className="admin-input h-10 pl-9" />
									</div>
								</div>
							</div>
							<div className="max-h-[60vh] overflow-y-auto p-6">
								{libraryLoading ? (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
										{Array.from({ length: 10 }).map((_, idx) => (
											<div key={idx} className="h-40 animate-pulse rounded-sm bg-[var(--pp-beige)]/40" />
										))}
									</div>
								) : libraryItems.length === 0 ? (
									<div className="py-12 text-center text-sm text-[var(--pp-muted)]">No media found.</div>
								) : (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
										{libraryItems.map((item) => {
											const activeUrl = libraryTarget === "image" ? form.image : form.mobileImage;
											const selected = activeUrl === item.url;
											return (
												<div
													key={item.id}
													className={`group relative cursor-pointer border ${selected ? "border-[4px] border-[var(--pp-gold)]" : "border-[var(--pp-border)]"}`}
													role="button"
													tabIndex={0}
													onClick={() => handleLibrarySelect(item)}
													onKeyDown={(event) => {
														if (event.key !== "Enter" && event.key !== " ") return;
														event.preventDefault();
														handleLibrarySelect(item);
													}}
												>
													<div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--pp-beige)]/40">
														<Image src={item.url} alt="Media" fill sizes="(max-width: 640px) 100vw, 200px" className="object-cover" />
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
															setPreviewItem(item);
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
				open={Boolean(previewItem)}
				item={
					previewItem
						? {
								url: previewItem.url,
								title: "Banner image preview",
								format: previewItem.format,
								width: previewItem.width,
								height: previewItem.height,
								bytes: previewItem.bytes,
								createdAt: previewItem.createdAt ?? null,
							}
						: null
				}
				onClose={() => setPreviewItem(null)}
			/>
		</div>
	);
}
