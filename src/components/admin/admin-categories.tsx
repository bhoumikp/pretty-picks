"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, RefreshCw, X, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import ToastStack from "@/components/ui/toast-stack";
import AdminCategoriesTable from "@/components/admin/admin-categories-table";
import AdminSelect from "@/components/admin/admin-select";
import { buildFieldErrors, focusFirstInvalid, validateRequired, validateUrlOptional } from "@/lib/validation";
import { RequiredMark } from "@/components/admin/admin-form-helpers";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";
import CloudinaryUploadWidget from "@/components/admin/cloudinary-upload-widget";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";

interface CategoryRow {
	id: string;
	name: string;
	slug: string;
	image?: string | null;
	isActive: boolean;
	productCount?: number;
	createdAt: string;
	updatedAt: string;
}

interface AdminCategoriesProps {
	initialCategories: CategoryRow[];
	initialTotal: number;
	initialPage: number;
	pageSize: number;
	initialQuery: string;
	initialSort: string[];
	initialDir: Array<"asc" | "desc">;
	initialStatus: "all" | "active" | "inactive";
}

const emptyForm = { id: "", name: "", image: "" };

const buildQueryString = (
	query: string,
	page: number,
	sort: string[],
	dir: Array<"asc" | "desc">,
	status: "all" | "active" | "inactive",
	pageSize: number,
	defaults: { sort: string; dir: "asc" | "desc"; pageSize: number; status: "all" | "active" | "inactive" }
) => {
	const params = new URLSearchParams();
	if (query.trim()) params.set("q", query.trim());
	if (sort[0] && sort[0] !== defaults.sort) params.set("sort", sort[0]);
	if (dir[0] && dir[0] !== defaults.dir) params.set("dir", dir[0]);
	if (status !== defaults.status) params.set("status", status);
	if (page > 1) params.set("page", String(page));
	if (pageSize !== defaults.pageSize) params.set("pageSize", String(pageSize));
	return params.toString();
};

export default function AdminCategories({
	initialCategories,
	initialTotal,
	initialPage,
	pageSize,
	initialQuery,
	initialSort,
	initialDir,
	initialStatus,
}: AdminCategoriesProps) {
	const storageKey = "admin-categories-state";
	const shouldPrefetch = process.env.NODE_ENV === "production";
	const categoryType = "parent";
	const [categories, setCategories] = useState(initialCategories);
	const [total, setTotal] = useState(initialTotal);
	const [page, setPage] = useState(initialPage);
	const [query, setQuery] = useState(initialQuery);
	const [status, setStatus] = useState<"all" | "active" | "inactive">(initialStatus);
	const [sort, setSort] = useState(initialSort);
	const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
	const [rowsPerPage, setRowsPerPage] = useState(pageSize);
	const [loading, setLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const userTypedRef = useRef(false);
	const restoredRef = useRef(false);
	const cacheRef = useRef(new Map<string, { items: CategoryRow[]; total: number }>());
	const defaults = useMemo(
		() => ({
			sort: initialSort[0] ?? "name",
			dir: (initialDir[0] ?? "asc") as "asc" | "desc",
			pageSize,
			status: initialStatus,
		}),
		[initialSort, initialDir, pageSize, initialStatus]
	);

	const [form, setForm] = useState(emptyForm);
	const [modalOpen, setModalOpen] = useState(false);
	const modalId = useId();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{ name?: string; image?: string }>({});
	const clearFieldError = (field: keyof typeof fieldErrors) => {
		setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
	};
	const [toasts, setToasts] = useState<
		Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
	>([]);
	const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [bulkLoading, setBulkLoading] = useState(false);

	const [libraryOpen, setLibraryOpen] = useState(false);
	const [libraryQuery, setLibraryQuery] = useState("");
	const [libraryItems, setLibraryItems] = useState<Array<{ id: string; url: string; publicId?: string | null }>>([]);
	const [libraryPage, setLibraryPage] = useState(1);
	const [libraryLoading, setLibraryLoading] = useState(false);
	const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
	const [previewItem, setPreviewItem] = useState<{ url: string; publicId?: string | null; title?: string } | null>(null);

	const mediaPageSize = 20;

	const fetchLibrary = useCallback(
		async (nextQuery: string, nextPage: number) => {
			setLibraryLoading(true);
			const params = new URLSearchParams();
			if (nextQuery.trim()) params.set("q", nextQuery.trim());
			params.set("page", String(nextPage));
			params.set("pageSize", String(mediaPageSize));
			const response = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" });
			if (response.ok) {
				const data = (await response.json()) as { items: Array<{ id: string; url: string; publicId?: string | null }>; total: number };
				setLibraryItems(data.items);
			} else {
				setLibraryItems([]);
			}
			setLibraryLoading(false);
		},
		[mediaPageSize]
	);

	useEffect(() => {
		if (!libraryOpen) return;
		const delay = libraryQuery ? 250 : 0;
		const handle = window.setTimeout(() => {
			fetchLibrary(libraryQuery, libraryPage);
		}, delay);
		return () => window.clearTimeout(handle);
	}, [fetchLibrary, libraryOpen, libraryPage, libraryQuery]);

	useEffect(() => {
		if (!libraryOpen && !previewItem) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			if (previewItem) setPreviewItem(null);
			if (libraryOpen) setLibraryOpen(false);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [libraryOpen, previewItem]);

	useEffect(() => {
		const handler = (event: Event) => {
			const custom = event as CustomEvent<{ id?: string }>;
			if (!modalOpen) return;
			if (custom.detail?.id && custom.detail.id !== modalId) {
				setModalOpen(false);
			}
		};
		window.addEventListener("pp-admin-modal-open", handler);
		return () => window.removeEventListener("pp-admin-modal-open", handler);
	}, [modalId, modalOpen]);

	useEffect(() => {
		if (!modalOpen) return;
		window.dispatchEvent(new CustomEvent("pp-admin-modal-open", { detail: { id: modalId } }));
	}, [modalId, modalOpen]);


	const syncUrl = useCallback(
		(
			nextQuery: string,
			nextPage: number,
			nextSort: string[],
			nextDir: Array<"asc" | "desc">,
			nextStatus: "all" | "active" | "inactive",
			nextPageSize: number
		) => {
			if (typeof window === "undefined") return;
			const params = buildQueryString(
				nextQuery,
				nextPage,
				nextSort,
				nextDir,
				nextStatus,
				nextPageSize,
				defaults
			);
			const url = params ? `/admin/categories?${params}` : "/admin/categories";
			window.history.replaceState(null, "", url);
		},
		[defaults]
	);

	const getCacheKey = useCallback(
		(
			nextQuery: string,
			nextPage: number,
			nextSort: string[],
			nextDir: Array<"asc" | "desc">,
			nextStatus: "all" | "active" | "inactive",
			nextPageSize: number
		) =>
			[
				nextQuery.trim(),
				nextPage,
				nextSort[0] ?? "",
				nextDir[0] ?? "",
				nextStatus,
				nextPageSize,
			].join("|"),
		[]
	);

	const fetchCategories = useCallback(
		async (
			nextQuery: string,
			nextPage: number,
			nextSort: string[],
			nextDir: Array<"asc" | "desc">,
			nextStatus: "all" | "active" | "inactive",
			options?: { prefetch?: boolean; force?: boolean }
		) => {
			const key = getCacheKey(nextQuery, nextPage, nextSort, nextDir, nextStatus, rowsPerPage);
			if (!options?.prefetch && !options?.force) {
				const cached = cacheRef.current.get(key);
				if (cached) {
					setCategories(cached.items);
					setTotal(cached.total);
					return;
				}
				setLoading(true);
			}
			const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, nextStatus, rowsPerPage, defaults);
			const response = await fetch(
				`/api/admin/categories?type=${categoryType}${params ? `&${params}` : ""}`,
				{ cache: "no-store" }
			);
			if (response.ok) {
				const data = (await response.json()) as { items: CategoryRow[]; total: number };
				cacheRef.current.set(key, data);
				if (!options?.prefetch) {
					setCategories(data.items);
					setTotal(data.total);
				}
			} else if (!options?.prefetch) {
				setCategories([]);
				setTotal(0);
			}
			if (!options?.prefetch) setLoading(false);
		},
		[categoryType, defaults, getCacheKey, rowsPerPage]
	);

	useEffect(() => {
		if (!userTypedRef.current) return;
		const handle = window.setTimeout(() => {
			const nextPage = 1;
			fetchCategories(query, nextPage, sort, dir, status);
			setPage(nextPage);
			syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
		}, 300);
		return () => window.clearTimeout(handle);
	}, [query, rowsPerPage, sort, dir, status, fetchCategories, syncUrl]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (restoredRef.current) return;
		const params = new URLSearchParams(window.location.search);
		const hasParams =
			params.has("q") ||
			params.has("sort") ||
			params.has("dir") ||
			params.has("status") ||
			params.has("page") ||
			params.has("pageSize");
		if (hasParams) return;
		const stored = window.sessionStorage.getItem(storageKey);
		if (!stored) return;
		try {
			restoredRef.current = true;
			const parsed = JSON.parse(stored) as {
				query?: string;
				page?: number;
				sort?: string[];
				dir?: Array<"asc" | "desc">;
				status?: "all" | "active" | "inactive";
				rowsPerPage?: number;
			};
			const nextQuery = parsed.query ?? query;
			const nextPage = parsed.page ?? page;
			const nextSort = parsed.sort ?? sort;
			const nextDir = parsed.dir ?? dir;
			const nextStatus = parsed.status ?? status;
			const nextRows = parsed.rowsPerPage ?? rowsPerPage;
			const isSameState =
				nextQuery === query &&
				nextPage === page &&
				JSON.stringify(nextSort) === JSON.stringify(sort) &&
				JSON.stringify(nextDir) === JSON.stringify(dir) &&
				nextStatus === status &&
				nextRows === rowsPerPage;
			if (isSameState) {
				restoredRef.current = true;
				return;
			}
			window.setTimeout(() => {
				setQuery(nextQuery);
				setPage(nextPage);
				setSort(nextSort);
				setDir(nextDir);
				setStatus(nextStatus);
				setRowsPerPage(nextRows);
				fetchCategories(nextQuery, nextPage, nextSort, nextDir, nextStatus);
				syncUrl(nextQuery, nextPage, nextSort, nextDir, nextStatus, nextRows);
			}, 0);
		} catch {
			restoredRef.current = false;
			window.sessionStorage.removeItem(storageKey);
		}
	}, [dir, fetchCategories, page, query, rowsPerPage, sort, status, syncUrl]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const payload = {
			query,
			page,
			sort,
			dir,
			status,
			rowsPerPage,
		};
		window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
	}, [query, page, sort, dir, status, rowsPerPage]);

	useEffect(() => {
		if (!shouldPrefetch) return;
		if (loading) return;
		const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
		if (page < totalPages) {
			fetchCategories(query, page + 1, sort, dir, status, { prefetch: true });
		}
		if (page > 1) {
			fetchCategories(query, page - 1, sort, dir, status, { prefetch: true });
		}
	}, [page, total, rowsPerPage, query, sort, dir, status, fetchCategories, loading, shouldPrefetch]);

	const handlePageChange = (nextPage: number) => {
		fetchCategories(query, nextPage, sort, dir, status);
		setPage(nextPage);
		syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
	};

	const handleSort = (key: string) => {
		const existingIndex = sort.indexOf(key);
		const currentDir = existingIndex >= 0 ? dir[existingIndex] : "desc";
		const nextDirection = currentDir === "asc" ? "desc" : "asc";
		const nextSort = [key];
		const nextDir: Array<"asc" | "desc"> = [nextDirection];

		const nextPage = 1;
		setSort(nextSort);
		setDir(nextDir);
		setPage(nextPage);
		fetchCategories(query, nextPage, nextSort, nextDir, status);
		syncUrl(query, nextPage, nextSort, nextDir, status, rowsPerPage);
	};

	const handleRowsChange = (nextRows: number) => {
		const nextPage = 1;
		setRowsPerPage(nextRows);
		setPage(nextPage);
		fetchCategories(query, nextPage, sort, dir, status);
		syncUrl(query, nextPage, sort, dir, status, nextRows);
	};

	const openAddModal = () => {
		setForm(emptyForm);
		setFieldErrors({});
		setError(null);
		setModalOpen(true);
	};

	const openEditModal = (category: CategoryRow) => {
		setForm({
			id: category.id,
			name: category.name,
			image: category.image ?? "",
		});
		setFieldErrors({});
		setError(null);
		setModalOpen(true);
	};

	const closeModal = useCallback(() => {
		setModalOpen(false);
		setForm(emptyForm);
		setFieldErrors({});
		setError(null);
	}, []);

	useEffect(() => {
		if (!modalOpen) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeModal();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [modalOpen, closeModal]);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSaving(true);
		setError(null);
		setFieldErrors({});

		const nextErrors = buildFieldErrors<"name" | "image">([
			{ key: "name", error: validateRequired(form.name, "Category name") },
			{ key: "image", error: validateUrlOptional(form.image, "Image URL") },
		]);
		if (Object.keys(nextErrors).length > 0) {
			setFieldErrors(nextErrors);
			focusFirstInvalid(nextErrors, [
				{ key: "name", selector: "#admin-category-name" },
				{ key: "image", selector: "#admin-category-image" },
			]);
			setSaving(false);
			return;
		}

		const payload = { name: form.name, image: form.image };
		const method = form.id ? "PATCH" : "POST";
		const url = form.id ? `/api/categories/${form.id}` : "/api/categories";

		const response = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			setError("Unable to save category. Please try again.");
			const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
			setToasts((prev) => [
				...prev,
				{ id, type: "error", message: "Unable to save category. Please try again." },
			]);
			setSaving(false);
			return;
		}

		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		setToasts((prev) => [
			...prev,
			{ id, type: "success", message: form.id ? "Category updated." : "Category created." },
		]);

		const nextPage = form.id ? page : 1;
		setPage(nextPage);
		setModalOpen(false);
		setForm(emptyForm);
		await fetchCategories(query, nextPage, sort, dir, status, { force: true });
		syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
		setSaving(false);
	};

	const handleDelete = (category: CategoryRow) => {
		setDeleteTarget(category);
	};

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		const response = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
		const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		if (!response.ok) {
			let message = "Unable to delete category.";
			try {
				const data = (await response.json()) as { childCount?: number; productCount?: number; error?: string };
				if (response.status === 409) {
					const parts = [];
					if (typeof data.childCount === "number" && data.childCount > 0) {
						parts.push(`${data.childCount} subcategor${data.childCount === 1 ? "y" : "ies"}`);
					}
					if (typeof data.productCount === "number" && data.productCount > 0) {
						parts.push(`${data.productCount} product${data.productCount === 1 ? "" : "s"}`);
					}
					message = parts.length
						? `Category has ${parts.join(" and ")}. Remove them first.`
						: "Category has linked items. Remove them first.";
				} else if (data.error) {
					message = data.error;
				}
			} catch {
				// ignore parse errors
			}
			setToasts((prev) => [
				...prev,
				{ id: toastId, type: "error", message },
			]);
			setDeleteLoading(false);
			return;
		}
		setToasts((prev) => [...prev, { id: toastId, type: "success", message: "Category deleted." }]);
		const shouldGoBack = categories.length <= 1 && page > 1;
		const nextPage = shouldGoBack ? page - 1 : page;
		setPage(nextPage);
		await fetchCategories(query, nextPage, sort, dir, status, { force: true });
		syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
		setDeleteLoading(false);
		setDeleteTarget(null);
	};

	const handleToggleActive = async (category: CategoryRow) => {
		const nextActive = !category.isActive;
		setCategories((prev) =>
			prev.map((item) =>
				item.id === category.id ? { ...item, isActive: nextActive, updatedAt: new Date().toISOString() } : item
			)
		);

		const response = await fetch(`/api/categories/${category.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isActive: nextActive }),
		});
		const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
		if (!response.ok) {
			setCategories((prev) =>
				prev.map((item) =>
					item.id === category.id
						? { ...item, isActive: category.isActive, updatedAt: category.updatedAt }
						: item
				)
			);
			setToasts((prev) => [
				...prev,
				{ id: toastId, type: "error", message: "Unable to update category status." },
			]);
			return;
		}
		setToasts((prev) => [
			...prev,
			{
				id: toastId,
				type: "success",
				message: nextActive ? "Category activated." : "Category deactivated.",
			},
		]);
	};

	const handleSelect = (id: string, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const handleSelectAll = (checked: boolean) => {
		if (!checked) {
			setSelectedIds(new Set());
			return;
		}
		setSelectedIds(new Set(categories.map((category) => category.id)));
	};

	const bulkUpdateActive = async (nextActive: boolean) => {
		const ids = Array.from(selectedIds);
		if (!ids.length) return;
		setBulkLoading(true);
		const updatedAt = new Date().toISOString();
		setCategories((prev) =>
			prev.map((item) => (selectedIds.has(item.id) ? { ...item, isActive: nextActive, updatedAt } : item))
		);
		setSelectedIds(new Set());
		await Promise.all(
			ids.map((id) =>
				fetch(`/api/categories/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isActive: nextActive }),
				})
			)
		);
		setBulkLoading(false);
	};

	const bulkArchive = async () => {
		const ids = Array.from(selectedIds);
		if (!ids.length) return;
		setBulkLoading(true);
		setSelectedIds(new Set());
		const responses = await Promise.all(
			ids.map((id) => fetch(`/api/categories/${id}`, { method: "DELETE" }))
		);
		const blocked = responses.filter((res) => !res.ok);
		if (blocked.length > 0) {
			const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
			setToasts((prev) => [
				...prev,
				{
					id: toastId,
					type: "error",
					message: "Some categories could not be deleted (linked products/subcategories).",
				},
			]);
		}
		await fetchCategories(query, page, sort, dir, status, { force: true });
		syncUrl(query, page, sort, dir, status, rowsPerPage);
		setBulkLoading(false);
	};

	return (
		<>
			<div className="grid gap-4">
				<AdminConfirmModal
					open={Boolean(deleteTarget)}
					title="Delete category?"
					description={deleteTarget ? `This will remove ${deleteTarget.name}.` : undefined}
					confirmLabel="Delete"
					status="danger"
					destructive
					onConfirm={confirmDelete}
					onCancel={() => setDeleteTarget(null)}
					loading={deleteLoading}
				/>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Catalog</p>
						<div className="flex items-center gap-2">
							<h2 className="text-2xl font-[var(--font-heading)]">Categories</h2>
							<button
								type="button"
								onClick={() => fetchCategories(query, page, sort, dir, status, { force: true })}
								disabled={loading || bulkLoading || deleteLoading}
								className="rounded-md p-1.5 text-[var(--pp-muted)] transition hover:bg-[var(--pp-beige)] hover:text-[var(--pp-ink)] disabled:opacity-50"
								title="Refresh categories"
							>
								<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--pp-gold)]" : ""}`} />
							</button>
						</div>
					</div>
					<div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
						<div className="flex w-full items-center gap-2 sm:max-w-xs">
							<label htmlFor="admin-categories-search" className="sr-only">
								Search categories
							</label>
							<input
								id="admin-categories-search"
								value={query}
								onChange={(event) => {
									userTypedRef.current = true;
									setQuery(event.target.value);
								}}
								placeholder="Search categories"
								className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
							/>
						</div>
						<div className="w-full sm:w-auto">
							<AdminSelect
								value={status}
								onChange={(nextValue) => {
									const nextStatus = nextValue as AdminCategoriesProps["initialStatus"];
									setStatus(nextStatus);
									const nextPage = 1;
									setPage(nextPage);
									fetchCategories(query, nextPage, sort, dir, nextStatus);
									syncUrl(query, nextPage, sort, dir, nextStatus, rowsPerPage);
								}}
								options={[
									{ value: "all", label: "All statuses" },
									{ value: "active", label: "Active" },
									{ value: "inactive", label: "Inactive" },
								]}
								header="Status"
								buttonClassName="h-10 w-full border border-[var(--pp-border)] bg-white px-3 py-2 text-xs"
							/>
						</div>
						<button
							type="button"
							onClick={openAddModal}
							className="btn-primary admin-btn admin-btn-size w-full sm:w-auto"
						>
							<span className="admin-btn-label">Add category</span>
						</button>
					</div>
				</div>

				{selectedIds.size > 0 && (
					<div className="flex flex-wrap items-center gap-2 rounded border border-[var(--pp-border)] bg-white px-4 py-3 text-sm">
						<span className="text-[var(--pp-muted)]">{selectedIds.size} selected</span>
						<div className="ml-auto flex flex-wrap gap-2">
							<button className="btn-outline admin-btn admin-btn-size" onClick={() => bulkUpdateActive(true)}>
								Activate
							</button>
							<button className="btn-outline admin-btn admin-btn-size" onClick={() => bulkUpdateActive(false)}>
								Deactivate
							</button>
							<button className="btn-outline admin-btn admin-btn-size" onClick={bulkArchive}>
								Delete
							</button>
						</div>
					</div>
				)}
				<AdminCategoriesTable
					categories={categories}
					page={page}
					pageSize={rowsPerPage}
					total={total}
					query={query}
					sort={sort}
					dir={dir}
					onSort={handleSort}
					onPageChange={handlePageChange}
					onEdit={openEditModal}
					onDelete={(id) => {
						const target = categories.find((item) => item.id === id);
						if (target) handleDelete(target);
					}}
					onToggleActive={handleToggleActive}
					selectedIds={selectedIds}
					onToggleSelect={handleSelect}
					onToggleSelectAll={handleSelectAll}
					isLoading={loading}
					footerSlot={
						<div className="flex items-center gap-2 text-xs text-[var(--pp-muted)]">
							<span className="h-5 w-[2px] bg-[var(--pp-ink)]/20" />
							Rows
							<AdminSelect
								value={rowsPerPage}
								onChange={(nextValue) => handleRowsChange(Number(nextValue))}
								options={[10, 15, 25, 50].map((value) => ({ value, label: String(value) }))}
								header="Rows"
								buttonClassName="h-8 min-w-[44px] border border-[var(--pp-border)] bg-white px-2 py-0.5 text-[11px]"
							/>
						</div>
					}
				/>
			</div>

			{modalOpen && (
				<div className="fixed inset-0 z-50 bg-black/40" onClick={closeModal}>
					<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
						<div
							className="w-full max-w-lg bg-white rounded-lg p-6 shadow-lg"
							onClick={(event) => event.stopPropagation()}
						>
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-[var(--font-heading)]">
									{form.id ? "Edit category" : "Add category"}
								</h3>
								<button
									type="button"
									onClick={closeModal}
									className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
									aria-label="Close modal"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
							<form onSubmit={handleSubmit} className="mt-4 grid gap-4" noValidate>
								<div className="grid gap-2">
									<label htmlFor="admin-category-name" className="admin-label">
										Category name<RequiredMark />
									</label>
									<input
										id="admin-category-name"
										className={`admin-input ${fieldErrors.name ? "is-error" : ""}`}
										placeholder="Category name"
										value={form.name}
										onChange={(event) => {
											setForm({ ...form, name: event.target.value });
											if (fieldErrors.name) clearFieldError("name");
										}}
										onBlur={(event) => {
											if (!fieldErrors.name) return;
											const result = validateRequired(event.target.value, "Category name");
											if (!result) {
												setFieldErrors((prev) => ({ ...prev, name: undefined }));
											}
										}}
									/>
									<span
										data-show={Boolean(fieldErrors.name)}
										className="field-error text-xs normal-case text-red-600"
									>
										{fieldErrors.name ?? ""}
									</span>
								</div>
								<div className="grid gap-2">
									<label className="admin-label">
										Category Image
									</label>
									<div className="flex flex-wrap items-center gap-3">
										<button
											type="button"
											className="btn-outline admin-btn admin-btn-size text-xs"
											onClick={() => {
												setLibraryOpen(true);
												setLibraryQuery("");
												setLibraryPage(1);
												setSelectedLibraryId(null);
											}}
										>
											Select from library
										</button>
										<CloudinaryUploadWidget
											maxFiles={1}
											onUpload={(uploads) => {
												if (uploads.length > 0) {
													setForm({ ...form, image: uploads[0].url });
													if (fieldErrors.image) clearFieldError("image");
												}
											}}
											onError={(msg) => {
												const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
												setToasts((prev) => [...prev, { id: toastId, message: msg, type: "error" }]);
											}}
										/>
									</div>
									<div className="mt-2">
										{form.image ? (
											<div className="group relative aspect-[4/5] w-32 overflow-hidden rounded-lg border border-[var(--pp-border)] bg-[var(--pp-beige)]/40">
												<Image
													src={form.image}
													alt="Category preview"
													fill
													className="object-cover"
													onClick={() => setPreviewItem({ url: form.image, title: form.name || "Category Image" })}
												/>
												<button
													type="button"
													onClick={() => setForm({ ...form, image: "" })}
													className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/60"
													aria-label="Remove image"
												>
													<Trash2 className="h-3 w-3" />
												</button>
											</div>
										) : (
											<div className="flex aspect-[4/5] w-32 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--pp-border)] bg-[var(--pp-beige)]/20 text-[10px] text-[var(--pp-muted)]">
												No image
											</div>
										)}
									</div>
									<span
										data-show={Boolean(fieldErrors.image)}
										className="field-error text-xs normal-case text-red-600"
									>
										{fieldErrors.image ?? ""}
									</span>
								</div>
								{error && <p className="text-sm text-red-600">{error}</p>}
								<div className="flex justify-end gap-3">
									<button type="button" className="btn-outline admin-btn admin-btn-size" onClick={closeModal}>
										Cancel
									</button>
									<button
										type="submit"
										className="btn-primary admin-btn admin-btn-size"
										disabled={saving}
									>
										<span className="admin-btn-label">
											{saving ? (form.id ? "Updating…" : "Saving…") : form.id ? "Update" : "Save"}
										</span>
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}
			<ToastStack
				toasts={toasts}
				onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
			/>

			{libraryOpen && (
				<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setLibraryOpen(false)}>
					<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
						<div className="w-full max-w-5xl bg-white rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
							<div className="border-b border-[var(--pp-border)] px-6 py-3">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div>
										<p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Library</p>
										<h3 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">Select image</h3>
									</div>
									<div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
										<div className="relative w-full sm:max-w-xs">
											<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pp-muted)]" />
											<input
												value={libraryQuery}
												onChange={(e) => setLibraryQuery(e.target.value)}
												placeholder="Search media"
												className="h-10 w-full border border-[var(--pp-border)] bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
											/>
										</div>
									</div>
								</div>
							</div>
							<div className="max-h-[60vh] overflow-y-auto p-6">
								{libraryLoading ? (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
										{Array.from({ length: 10 }).map((_, idx) => (
											<div key={idx} className="h-40 bg-[var(--pp-beige)]/40 animate-pulse rounded-lg" />
										))}
									</div>
								) : libraryItems.length === 0 ? (
									<div className="py-12 text-center text-sm text-[var(--pp-muted)]">No media found.</div>
								) : (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
										{libraryItems.map((item) => {
											const isSelected = selectedLibraryId === item.id;
											return (
												<div
													key={item.id}
													className={`relative border cursor-pointer rounded-lg overflow-hidden transition-all ${
														isSelected ? "ring-4 ring-[var(--pp-gold)]" : "border-[var(--pp-border)]"
													}`}
													onClick={() => setSelectedLibraryId(item.id)}
												>
													<div className="relative aspect-[4/5] bg-[var(--pp-beige)]/40">
														<Image src={item.url} alt="Media" fill className="object-cover" sizes="200px" />
														{isSelected && (
															<div className="absolute inset-0 bg-[var(--pp-gold)]/10 flex items-center justify-center">
																<Check className="h-8 w-8 text-[var(--pp-gold)]" />
															</div>
														)}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
							<div className="flex items-center justify-between border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/40 px-6 py-4">
								<p className="text-xs text-[var(--pp-muted)]">
									{selectedLibraryId ? "1 image selected" : "Select an image"}
								</p>
								<div className="flex gap-3">
									<button className="btn-outline admin-btn admin-btn-size" onClick={() => setLibraryOpen(false)}>
										Cancel
									</button>
									<button
										className="btn-primary admin-btn admin-btn-size"
										disabled={!selectedLibraryId}
										onClick={() => {
											const item = libraryItems.find(i => i.id === selectedLibraryId);
											if (item) {
												setForm({ ...form, image: item.url });
												if (fieldErrors.image) clearFieldError("image");
											}
											setLibraryOpen(false);
										}}
									>
										Confirm selection
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			<AdminMediaViewer
				open={Boolean(previewItem)}
				item={previewItem}
				onClose={() => setPreviewItem(null)}
			/>
		</>
	);
}
