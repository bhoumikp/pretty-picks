"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AdminProductsTable from "@/components/admin/admin-products-table";
import AdminSelect from "@/components/admin/admin-select";
import type { ProductImage } from "@/types/catalog";
import type { ToastItem } from "@/components/ui/toast-stack";
import AdminProductsToastBridge from "@/components/admin/admin-products-toast-bridge";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";
import { RefreshCw } from "lucide-react";

interface ProductRow {
	id: string;
	name: string;
	price: number;
	stock: number;
	isActive: boolean;
	categoryName?: string | null;
	image?: ProductImage | null;
	createdAt: string;
	updatedAt: string;
}

interface AdminProductsClientProps {
	initialProducts: ProductRow[];
	initialTotal: number;
	initialPage: number;
	pageSize: number;
	initialQuery: string;
	initialSort: string[];
	initialDir: Array<"asc" | "desc">;
	initialStatus: "all" | "active" | "inactive";
}

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

export default function AdminProductsClient({
	initialProducts,
	initialTotal,
	initialPage,
	pageSize,
	initialQuery,
	initialSort,
	initialDir,
	initialStatus,
}: AdminProductsClientProps) {
	const storageKey = "admin-products-state";
	const shouldPrefetch = process.env.NODE_ENV === "production";
	const onToastRef = useRef<((toast: Omit<ToastItem, "id">) => void) | null>(null);
	const [products, setProducts] = useState(initialProducts);
	const [total, setTotal] = useState(initialTotal);
	const [page, setPage] = useState(initialPage);
	const [query, setQuery] = useState(initialQuery);
	const [status, setStatus] = useState<"all" | "active" | "inactive">(initialStatus);
	const [sort, setSort] = useState(initialSort);
	const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
	const [rowsPerPage, setRowsPerPage] = useState(pageSize);
	const [loading, setLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [reordering, setReordering] = useState(false);
	const userTypedRef = useRef(false);
	const restoredRef = useRef(false);
	const cacheRef = useRef(new Map<string, { items: ProductRow[]; total: number }>());
	const defaults = useMemo(
		() => ({
			sort: initialSort[0] ?? "updatedAt",
			dir: (initialDir[0] ?? "desc") as "asc" | "desc",
			pageSize,
			status: initialStatus,
		}),
		[initialSort, initialDir, pageSize, initialStatus]
	);

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
			const url = params ? `/admin/products?${params}` : "/admin/products";
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

	const fetchProducts = useCallback(
		async (
			nextQuery: string,
			nextPage: number,
			nextSort: string[],
			nextDir: Array<"asc" | "desc">,
			nextStatus: "all" | "active" | "inactive",
			options?: { prefetch?: boolean; force?: boolean }
		) => {
			const key = getCacheKey(nextQuery, nextPage, nextSort, nextDir, nextStatus, rowsPerPage);
			if (!options?.prefetch) {
				const cached = cacheRef.current.get(key);
				if (cached && !options?.force) {
					setProducts(cached.items);
					setTotal(cached.total);
					return;
				}
				setLoading(true);
			}
			const params = buildQueryString(
				nextQuery,
				nextPage,
				nextSort,
				nextDir,
				nextStatus,
				rowsPerPage,
				defaults
			);
			const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
			if (response.ok) {
				const data = (await response.json()) as { items: ProductRow[]; total: number };
				cacheRef.current.set(key, data);
				if (!options?.prefetch) {
					setProducts(data.items);
					setTotal(data.total);
				}
			} else if (!options?.prefetch) {
				setProducts([]);
				setTotal(0);
			}
			if (!options?.prefetch) setLoading(false);
		},
		[defaults, getCacheKey, rowsPerPage]
	);

	useEffect(() => {
		if (!userTypedRef.current) return;
		const handle = window.setTimeout(() => {
			const nextPage = 1;
			fetchProducts(query, nextPage, sort, dir, status);
			setPage(nextPage);
			syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
		}, 300);
		return () => window.clearTimeout(handle);
	}, [query, rowsPerPage, sort, dir, status, fetchProducts, syncUrl]);

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
				fetchProducts(nextQuery, nextPage, nextSort, nextDir, nextStatus);
				syncUrl(nextQuery, nextPage, nextSort, nextDir, nextStatus, nextRows);
			}, 0);
		} catch {
			restoredRef.current = false;
			window.sessionStorage.removeItem(storageKey);
		}
	}, [dir, fetchProducts, page, query, rowsPerPage, sort, status, syncUrl]);

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
			fetchProducts(query, page + 1, sort, dir, status, { prefetch: true });
		}
		if (page > 1) {
			fetchProducts(query, page - 1, sort, dir, status, { prefetch: true });
		}
	}, [page, total, rowsPerPage, query, sort, dir, status, fetchProducts, loading, shouldPrefetch]);

	const handlePageChange = (nextPage: number) => {
		fetchProducts(query, nextPage, sort, dir, status);
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
		fetchProducts(query, nextPage, nextSort, nextDir, status);
		syncUrl(query, nextPage, nextSort, nextDir, status, rowsPerPage);
	};

	const handleRowsChange = (nextRows: number) => {
		const nextPage = 1;
		setRowsPerPage(nextRows);
		setPage(nextPage);
		fetchProducts(query, nextPage, sort, dir, status);
		syncUrl(query, nextPage, sort, dir, status, nextRows);
	};

	const handleToggleActive = async (product: ProductRow) => {
		const nextActive = !product.isActive;
		const nextUpdatedAt = new Date().toISOString();
		setProducts((prev) =>
			prev.map((item) =>
				item.id === product.id ? { ...item, isActive: nextActive, updatedAt: nextUpdatedAt } : item
			)
		);

		try {
			const response = await fetch(`/api/products/${product.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive: nextActive }),
			});
			if (!response.ok) throw new Error("Failed to update status");
			onToastRef.current?.({
				message: nextActive ? "Product activated." : "Product deactivated.",
				type: "success",
			});
		} catch {
			setProducts((prev) =>
				prev.map((item) =>
					item.id === product.id
						? { ...item, isActive: product.isActive, updatedAt: product.updatedAt }
						: item
				)
			);
			onToastRef.current?.({ message: "Unable to update product status.", type: "error" });
		}
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
		setSelectedIds(new Set(products.map((product) => product.id)));
	};

	const bulkUpdateActive = async (nextActive: boolean) => {
		const ids = Array.from(selectedIds);
		if (!ids.length) return;
		const updatedAt = new Date().toISOString();
		setProducts((prev) =>
			prev.map((item) =>
				selectedIds.has(item.id) ? { ...item, isActive: nextActive, updatedAt } : item
			)
		);
		setSelectedIds(new Set());
		await Promise.all(
			ids.map((id) =>
				fetch(`/api/products/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ isActive: nextActive }),
				})
			)
		);
	};

	const bulkArchive = async () => {
		const ids = Array.from(selectedIds);
		if (!ids.length) return;
		setProducts((prev) => prev.filter((item) => !selectedIds.has(item.id)));
		setTotal((prev) => Math.max(0, prev - ids.length));
		setSelectedIds(new Set());
		await Promise.all(ids.map((id) => fetch(`/api/products/${id}`, { method: "DELETE" })));
	};

	const handleReorder = async (nextProducts: ProductRow[]) => {
		setReordering(true);
		const orders = nextProducts.map((p, i) => ({ id: p.id, priority: i }));
		
		// Optimistic update
		setProducts(nextProducts);

		const response = await fetch("/api/admin/products/reorder", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orders }),
		});

		if (!response.ok) {
			onToastRef.current?.({ message: "Failed to save new order.", type: "error" });
			// Rollback
			fetchProducts(query, page, sort, dir, status, { force: true });
		} else {
			onToastRef.current?.({ message: "Order updated successfully.", type: "success" });
		}
		setReordering(false);
	};

	const handleDelete = (product: ProductRow) => {
		setDeleteTarget(product);
	};

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		const response = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
		setDeleteLoading(false);
		if (!response.ok) {
			let message = "Unable to delete product.";
			try {
				const data = (await response.json()) as { orderCount?: number; error?: string };
				if (response.status === 409 && typeof data.orderCount === "number") {
					message = `Product has ${data.orderCount} order${data.orderCount === 1 ? "" : "s"}. Remove orders first.`;
				} else if (data.error) {
					message = data.error;
				}
			} catch {
				// ignore parse errors
			}
			onToastRef.current?.({
				message,
				type: "error",
			});
			return;
		}
		setDeleteTarget(null);
		const nextPage = products.length <= 1 && page > 1 ? page - 1 : page;
		setPage(nextPage);
		fetchProducts(query, nextPage, sort, dir, status, { force: true });
		syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
		onToastRef.current?.({ message: "Product deleted.", type: "success" });
	};

	return (
		<div className="grid gap-4">
			<AdminConfirmModal
				open={Boolean(deleteTarget)}
				title="Delete product?"
				description={deleteTarget ? `This will remove ${deleteTarget.name}.` : undefined}
				confirmLabel="Delete"
				status="danger"
				destructive
				onConfirm={confirmDelete}
				onCancel={() => setDeleteTarget(null)}
				loading={deleteLoading}
			/>
			<AdminProductsToastBridge onToastReady={(handler) => (onToastRef.current = handler)} />
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Catalog</p>
					<div className="flex items-center gap-2">
						<h2 className="text-2xl font-[var(--font-heading)]">Products</h2>
						<button
							type="button"
							onClick={() => fetchProducts(query, page, sort, dir, status, { force: true })}
							disabled={loading || deleteLoading}
							className="rounded-md p-1.5 text-[var(--pp-muted)] transition hover:bg-[var(--pp-beige)] hover:text-[var(--pp-ink)] disabled:opacity-50"
							title="Refresh products"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--pp-gold)]" : ""}`} />
						</button>
					</div>
				</div>
				<div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
					<div className="flex w-full flex-wrap items-end gap-2 sm:max-w-[28rem]">
						<div className="flex w-full items-center gap-2 sm:flex-1">
							<label htmlFor="admin-products-search" className="sr-only">
								Search products
							</label>
							<input
								id="admin-products-search"
								value={query}
								onChange={(event) => {
									userTypedRef.current = true;
									setQuery(event.target.value);
								}}
								placeholder="Search products"
								className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
							/>
						</div>
						<div className="w-full sm:w-auto">
							<AdminSelect
								value={status}
								onChange={(nextValue) => {
									const nextStatus = nextValue as "all" | "active" | "inactive";
									setStatus(nextStatus);
									const nextPage = 1;
									setPage(nextPage);
									fetchProducts(query, nextPage, sort, dir, nextStatus);
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
					</div>
					<Link href="/admin/products/new" className="btn-primary admin-btn admin-btn-size w-full sm:w-auto">
						<span className="admin-btn-label">Add product</span>
					</Link>
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
			<AdminProductsTable
				products={products}
				page={page}
				pageSize={rowsPerPage}
				total={total}
				query={query}
				sort={sort}
				dir={dir}
				onSort={handleSort}
				onPageChange={handlePageChange}
				onToggleActive={handleToggleActive}
				selectedIds={selectedIds}
				onToggleSelect={handleSelect}
				onToggleSelectAll={handleSelectAll}
				onDelete={(id) => {
					const target = products.find((product) => product.id === id);
					if (target) handleDelete(target);
				}}
				onReorder={handleReorder}
				isReordering={reordering}
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
	);
}
