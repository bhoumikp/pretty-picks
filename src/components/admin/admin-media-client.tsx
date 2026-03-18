"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, RefreshCw } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";
import CloudinaryUploadWidget from "@/components/admin/cloudinary-upload-widget";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";
import AdminSelect from "@/components/admin/admin-select";
import ToastStack from "@/components/ui/toast-stack";
import { RequiredMark } from "@/components/admin/admin-form-helpers";

interface MediaRow {
	id: string;
	url: string;
	publicId?: string | null;
	format?: string | null;
	width?: number | null;
	height?: number | null;
	bytes?: number | null;
	alt?: string | null;
	createdAt: string;
}

interface AdminMediaClientProps {
	initialItems: MediaRow[];
	initialTotal: number;
	initialPage: number;
	pageSize: number;
	initialQuery: string;
}

const buildQueryString = (query: string, page: number, pageSize: number) => {
	const params = new URLSearchParams();
	if (query.trim()) params.set("q", query.trim());
	if (page > 1) params.set("page", String(page));
	if (pageSize !== 24) params.set("pageSize", String(pageSize));
	return params.toString();
};

export default function AdminMediaClient({
	initialItems,
	initialTotal,
	initialPage,
	pageSize,
	initialQuery,
}: AdminMediaClientProps) {
	const storageKey = "admin-media-state";
	const shouldPrefetch = process.env.NODE_ENV === "production";
	const [items, setItems] = useState(initialItems);
	const [total, setTotal] = useState(initialTotal);
	const [page, setPage] = useState(initialPage);
	const [query, setQuery] = useState(initialQuery);
	const [rowsPerPage, setRowsPerPage] = useState(pageSize);
	const [loading, setLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<MediaRow | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [renameTarget, setRenameTarget] = useState<MediaRow | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const [renameLoading, setRenameLoading] = useState(false);
	const [renameError, setRenameError] = useState<string | null>(null);
	const [previewTarget, setPreviewTarget] = useState<MediaRow | null>(null);
	const [toasts, setToasts] = useState<
		Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
	>([]);
	const userTypedRef = useRef(false);
	const restoredRef = useRef(false);
	const cacheRef = useRef(new Map<string, { items: MediaRow[]; total: number }>());

	const syncUrl = useCallback((nextQuery: string, nextPage: number, nextPageSize: number) => {
		if (typeof window === "undefined") return;
		const params = buildQueryString(nextQuery, nextPage, nextPageSize);
		const url = params ? `/admin/media?${params}` : "/admin/media";
		window.history.replaceState(null, "", url);
	}, []);

	const getCacheKey = useCallback(
		(nextQuery: string, nextPage: number, nextPageSize: number) =>
			[nextQuery.trim(), nextPage, nextPageSize].join("|"),
		[]
	);

	const fetchMedia = useCallback(
		async (
			nextQuery: string,
			nextPage: number,
			nextPageSize: number,
			options?: { prefetch?: boolean; force?: boolean }
		) => {
			const key = getCacheKey(nextQuery, nextPage, nextPageSize);
			if (!options?.prefetch) {
				const cached = cacheRef.current.get(key);
				if (cached && !options?.force) {
					setItems(cached.items);
					setTotal(cached.total);
					return;
				}
				setLoading(true);
			}
			const params = buildQueryString(nextQuery, nextPage, nextPageSize);
			const response = await fetch(`/api/admin/media?${params}`, { cache: "no-store" });
			if (response.ok) {
				const data = (await response.json()) as { items: MediaRow[]; total: number };
				cacheRef.current.set(key, data);
				if (!options?.prefetch) {
					setItems(data.items);
					setTotal(data.total);
				}
			} else if (!options?.prefetch) {
				setItems([]);
				setTotal(0);
			}
			if (!options?.prefetch) setLoading(false);
		},
		[getCacheKey]
	);

	useEffect(() => {
		if (!userTypedRef.current) return;
		const handle = window.setTimeout(() => {
			const nextPage = 1;
			fetchMedia(query, nextPage, rowsPerPage);
			setPage(nextPage);
			syncUrl(query, nextPage, rowsPerPage);
		}, 300);
		return () => window.clearTimeout(handle);
	}, [query, rowsPerPage, fetchMedia, syncUrl]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (restoredRef.current) return;
		const params = new URLSearchParams(window.location.search);
		const hasParams = params.has("q") || params.has("page") || params.has("pageSize");
		if (hasParams) return;
		const stored = window.sessionStorage.getItem(storageKey);
		if (!stored) return;
		try {
			restoredRef.current = true;
			const parsed = JSON.parse(stored) as { query?: string; page?: number; rowsPerPage?: number };
			const nextQuery = parsed.query ?? query;
			const nextPage = parsed.page ?? page;
			const nextRows = parsed.rowsPerPage ?? rowsPerPage;
			const isSameState = nextQuery === query && nextPage === page && nextRows === rowsPerPage;
			if (isSameState) {
				restoredRef.current = true;
				return;
			}
			window.setTimeout(() => {
				setQuery(nextQuery);
				setPage(nextPage);
				setRowsPerPage(nextRows);
				fetchMedia(nextQuery, nextPage, nextRows);
				syncUrl(nextQuery, nextPage, nextRows);
			}, 0);
		} catch {
			restoredRef.current = false;
			window.sessionStorage.removeItem(storageKey);
		}
	}, [fetchMedia, page, query, rowsPerPage, syncUrl]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const payload = { query, page, rowsPerPage };
		window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
	}, [query, page, rowsPerPage]);

	useEffect(() => {
		if (!shouldPrefetch) return;
		if (loading) return;
		const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
		if (page < totalPages) {
			fetchMedia(query, page + 1, rowsPerPage, { prefetch: true });
		}
		if (page > 1) {
			fetchMedia(query, page - 1, rowsPerPage, { prefetch: true });
		}
	}, [page, total, rowsPerPage, query, fetchMedia, loading, shouldPrefetch]);

	const handlePageChange = (nextPage: number) => {
		fetchMedia(query, nextPage, rowsPerPage);
		setPage(nextPage);
		syncUrl(query, nextPage, rowsPerPage);
	};

	const handleRowsChange = (nextRows: number) => {
		const nextPage = 1;
		setRowsPerPage(nextRows);
		setPage(nextPage);
		fetchMedia(query, nextPage, nextRows);
		syncUrl(query, nextPage, nextRows);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		const response = await fetch(`/api/admin/media/${deleteTarget.id}`, { method: "DELETE" });
		setDeleteLoading(false);
		setDeleteTarget(null);
		if (!response.ok) {
			const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
			setToasts((prev) => [...prev, { id, type: "error", message: "Unable to delete media." }]);
			return;
		}
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		setToasts((prev) => [...prev, { id, type: "success", message: "Media deleted." }]);
		const nextPage = items.length <= 1 && page > 1 ? page - 1 : page;
		setPage(nextPage);
		fetchMedia(query, nextPage, rowsPerPage, { force: true });
		syncUrl(query, nextPage, rowsPerPage);
	};

	const openRename = (item: MediaRow) => {
		setRenameError(null);
		setRenameTarget(item);
		setRenameValue(item.alt ?? item.publicId ?? "");
	};

	const handleRename = async () => {
		if (!renameTarget) return;
		const nextName = renameValue.trim();
		if (!nextName) {
			setRenameError("Name is required.");
			return;
		}
		setRenameLoading(true);
		const response = await fetch(`/api/admin/media/${renameTarget.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ alt: nextName }),
		});
		setRenameLoading(false);
		if (!response.ok) {
			setRenameError("Unable to rename media.");
			return;
		}
		setRenameTarget(null);
		setRenameError(null);
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		setToasts((prev) => [...prev, { id, type: "success", message: "Media renamed." }]);
		setItems((prev) =>
			prev.map((item) =>
				item.id === renameTarget.id
					? {
							...item,
							alt: nextName,
						}
					: item
			)
		);
		cacheRef.current.clear();
	};

	useEffect(() => {
		if (!previewTarget && !renameTarget) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			if (previewTarget) setPreviewTarget(null);
			if (renameTarget) setRenameTarget(null);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [previewTarget, renameTarget]);

	return (
		<div className="grid gap-4">
			<AdminConfirmModal
				open={Boolean(deleteTarget)}
				title="Delete media?"
				description={deleteTarget ? "This will remove the file from Cloudinary." : undefined}
				confirmLabel="Delete"
				status="danger"
				destructive
				onConfirm={handleDelete}
				onCancel={() => setDeleteTarget(null)}
				loading={deleteLoading}
			/>
			<AdminMediaViewer
				open={Boolean(previewTarget)}
				item={
					previewTarget
						? {
								url: previewTarget.url,
								title: previewTarget.alt ?? previewTarget.publicId ?? "Media preview",
								subtitle: previewTarget.publicId ?? null,
								format: previewTarget.format ?? null,
								width: previewTarget.width ?? null,
								height: previewTarget.height ?? null,
								bytes: previewTarget.bytes ?? null,
								alt: previewTarget.alt ?? null,
								createdAt: previewTarget.createdAt,
							}
						: null
				}
				onClose={() => setPreviewTarget(null)}
			/>
			{renameTarget && (
				<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setRenameTarget(null)}>
					<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
						<div
							className="w-full max-w-lg border border-[var(--pp-border)] bg-white rounded-lg p-6 shadow-lg"
							onClick={(event) => event.stopPropagation()}
						>
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-[var(--font-heading)]">Rename media</h3>
								<button
									type="button"
									onClick={() => setRenameTarget(null)}
									className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
									aria-label="Close modal"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
							<form
								onSubmit={(event) => {
									event.preventDefault();
									handleRename();
								}}
								className="mt-4 grid gap-4"
								noValidate
							>
								<div className="grid gap-2">
									<label htmlFor="admin-media-rename" className="admin-label">
										Media name
										<RequiredMark />
									</label>
									<input
										id="admin-media-rename"
										className={`admin-input ${renameError ? "is-error" : ""}`}
										value={renameValue}
										onChange={(event) => {
											setRenameError(null);
											setRenameValue(event.target.value);
										}}
									/>
									<span data-show={Boolean(renameError)} className="field-error text-xs normal-case text-red-600">
										{renameError ?? ""}
									</span>
								</div>
								<div className="flex justify-end gap-3">
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => setRenameTarget(null)}
									>
										Cancel
									</button>
									<button type="submit" className="btn-primary admin-btn admin-btn-size" disabled={renameLoading}>
										<span className="admin-btn-label">{renameLoading ? "Renaming…" : "Rename"}</span>
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Library</p>
					<div className="flex items-center gap-2">
						<h2 className="text-2xl font-[var(--font-heading)]">Media</h2>
						<button
							type="button"
							onClick={() => fetchMedia(query, page, rowsPerPage, { force: true })}
							disabled={loading || deleteLoading}
							className="rounded-md p-1.5 text-[var(--pp-muted)] transition hover:bg-[var(--pp-beige)] hover:text-[var(--pp-ink)] disabled:opacity-50"
							title="Refresh media"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--pp-gold)]" : ""}`} />
						</button>
					</div>
				</div>
				<div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
					<div className="flex w-full items-center gap-2 sm:max-w-xs">
						<label htmlFor="admin-media-search" className="sr-only">
							Search media
						</label>
						<input
							id="admin-media-search"
							value={query}
							onChange={(event) => {
								userTypedRef.current = true;
								setQuery(event.target.value);
							}}
							placeholder="Search media"
							className="admin-input h-10"
						/>
					</div>
					<CloudinaryUploadWidget
						maxFiles={12}
						maxSizeMb={6}
						registerInLibrary={false}
						onUpload={async (uploads) => {
							const response = await fetch("/api/admin/media", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ items: uploads }),
							});
							if (!response.ok) {
								const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
								setToasts((prev) => [...prev, { id, type: "error", message: "Unable to save media." }]);
								return;
							}
							const data = (await response.json()) as { items?: MediaRow[] };
							const created = data.items ?? [];
							if (created.length) {
								cacheRef.current.clear();
								setPage(1);
								setItems((prev) => [...created, ...prev].slice(0, rowsPerPage));
								setTotal((prev) => prev + created.length);
								syncUrl(query, 1, rowsPerPage);
							} else {
								const nextPage = 1;
								setPage(nextPage);
								fetchMedia(query, nextPage, rowsPerPage, { force: true });
								syncUrl(query, nextPage, rowsPerPage);
							}
						}}
						onUploadedSummary={(count) => {
							const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
							setToasts((prev) => [
								...prev,
								{ id, type: "success", message: `${count} file${count === 1 ? "" : "s"} added.` },
							]);
						}}
						onError={(message) => {
							const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
							setToasts((prev) => [...prev, { id, type: "error", message }]);
						}}
					/>
				</div>
			</div>

			<AdminTableShell
				page={page}
				pageSize={rowsPerPage}
				total={total}
				onPageChange={handlePageChange}
				isLoading={loading}
				footerSlot={
					<div className="flex items-center gap-2 text-xs text-[var(--pp-muted)]">
						<span className="h-5 w-[2px] bg-[var(--pp-ink)]/20" />
						Rows
						<AdminSelect
							value={rowsPerPage}
							onChange={(nextValue) => handleRowsChange(Number(nextValue))}
							options={[12, 24, 36, 48].map((value) => ({ value, label: String(value) }))}
							header="Rows"
							buttonClassName="h-8 min-w-[44px] border border-[var(--pp-border)] bg-white px-2 py-0.5 text-[11px]"
						/>
					</div>
				}
			>
				{items.length === 0 && !loading ? (
					<div className="px-6 py-12 text-center text-sm text-[var(--pp-muted)]">
						No media found.
					</div>
				) : (
					<div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
						{items.map((item) => (
							<div
								key={item.id}
								role="button"
								tabIndex={0}
								onClick={() => setPreviewTarget(item)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === " ") {
										event.preventDefault();
										setPreviewTarget(item);
									}
								}}
								className="group relative cursor-pointer overflow-hidden border border-[var(--pp-border)] bg-white text-left transition"
								aria-label="Open preview"
							>
								<div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--pp-beige)]/40">
									<button
										type="button"
										className="absolute inset-0 cursor-pointer"
										onClick={(event) => {
											event.stopPropagation();
											setPreviewTarget(item);
										}}
										aria-label="Preview media"
									/>
									<Image
										src={item.url}
										alt={item.alt ?? "Media asset"}
										fill
										sizes="(max-width: 640px) 100vw, 240px"
										className="object-cover"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />
									<button
										type="button"
										className="admin-tooltip-trigger absolute right-[52px] top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 hover:border-sky-200/70 hover:text-sky-50 hover:shadow-[0_0_0_2px_rgba(56,189,248,0.25)] group-hover:opacity-100 group-focus-within:opacity-100"
										onClick={(event) => {
											event.stopPropagation();
											openRename(item);
										}}
										aria-label="Rename media"
									>
										<Pencil className="h-4 w-4" />
										<span className="admin-tooltip admin-tooltip--info">
											Rename
										</span>
									</button>
									<button
										type="button"
										className="admin-tooltip-trigger absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 hover:border-red-300/70 hover:text-red-50 hover:shadow-[0_0_0_2px_rgba(239,68,68,0.25)] group-hover:opacity-100 group-focus-within:opacity-100"
										onClick={(event) => {
											event.stopPropagation();
											setDeleteTarget(item);
										}}
										aria-label="Delete media"
									>
										<Trash2 className="h-4 w-4" />
										<span className="admin-tooltip admin-tooltip--danger">
											Delete
										</span>
									</button>
									<div className="absolute inset-x-0 bottom-0">
										<div className="mx-2 mb-2 rounded-lg border border-white/40 bg-white/65 px-3 py-2 text-[11px] text-[var(--pp-ink)] backdrop-blur-md transition-all duration-200 group-hover:bg-white/85 group-hover:py-3 group-focus-within:bg-white/85 group-focus-within:py-3">
											<div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
												<span>
													{item.width && item.height ? `${item.width}×${item.height}` : "—"}
												</span>
												<span>{item.bytes ? `${Math.round(item.bytes / 1024)} KB` : "—"}</span>
											</div>
											<div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-[var(--pp-ink)]/70 opacity-0 max-h-0 overflow-hidden transition-all duration-200 group-hover:opacity-100 group-hover:max-h-6 group-focus-within:opacity-100 group-focus-within:max-h-6">
												<span className="truncate">{item.alt ?? item.publicId ?? "Media file"}</span>
												<span className="rounded-full border border-[var(--pp-ink)]/20 bg-white/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--pp-ink)]">
													{item.format?.toUpperCase() ?? "IMG"}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</AdminTableShell>
			<ToastStack
				toasts={toasts}
				onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
			/>
		</div>
	);
}
