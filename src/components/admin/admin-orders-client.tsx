"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import AdminOrdersTable, { type OrderRow } from "@/components/admin/admin-orders-table";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";
import AdminSelect from "@/components/admin/admin-select";
import { ToastContext } from "@/components/admin/admin-toast-provider";
import { useContext } from "react";
import { Trash2, RefreshCw, X } from "lucide-react";
import { buildFieldErrors, focusFirstInvalid, validatePhone, validateRequired } from "@/lib/validation";
import { RequiredMark } from "@/components/admin/admin-form-helpers";
import { formatCurrency } from "@/lib/utils";

interface AdminOrdersClientProps {
	initialOrders: OrderRow[];
	initialTotal: number;
	initialPage: number;
	pageSize: number;
	initialQuery: string;
	initialSort: string[];
	initialDir: Array<"asc" | "desc">;
	initialStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled";
	onOpenCreate?: () => void;
	registerRefresh?: (fn: (options?: { resetPage?: boolean }) => void) => void;
}

const buildQueryString = (
	query: string,
	page: number,
	sort: string[],
	dir: Array<"asc" | "desc">,
	status: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled",
	pageSize: number,
	defaults: {
		sort: string;
		dir: "asc" | "desc";
		pageSize: number;
		status: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled";
	}
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

export default function AdminOrdersClient({
	initialOrders,
	initialTotal,
	initialPage,
	pageSize,
	initialQuery,
	initialSort,
	initialDir,
	initialStatus,
	onOpenCreate,
	registerRefresh,
}: AdminOrdersClientProps) {
	const storageKey = "admin-orders-state";
	const shouldPrefetch = process.env.NODE_ENV === "production";
	const [orders, setOrders] = useState(initialOrders);
	const [total, setTotal] = useState(initialTotal);
	const [page, setPage] = useState(initialPage);
	const [query, setQuery] = useState(initialQuery);
	const [status, setStatus] = useState<"all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled">(
		initialStatus
	);
	const [sort, setSort] = useState(initialSort);
	const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
	const [rowsPerPage, setRowsPerPage] = useState(pageSize);
	const [loading, setLoading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [viewTarget, setViewTarget] = useState<OrderRow | null>(null);
	const [editTarget, setEditTarget] = useState<OrderRow | null>(null);
	const [editName, setEditName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{ customerName?: string; phone?: string }>({});
	const clearFieldError = (field: keyof typeof fieldErrors) => {
		setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
	};
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [bulkLoading, setBulkLoading] = useState(false);
	const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
	const modalId = useId();
	const toastContext = useContext(ToastContext);
	const userTypedRef = useRef(false);
	const restoredRef = useRef(false);
	const cacheRef = useRef(new Map<string, { items: OrderRow[]; total: number }>());
	const defaults = useMemo(
		() => ({
			sort: initialSort[0] ?? "createdAt",
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
			nextStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled",
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
			const url = params ? `/admin/orders?${params}` : "/admin/orders";
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
			nextStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled",
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

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handler = (event: Event) => {
			const custom = event as CustomEvent<{ id?: string }>;
			if (custom.detail?.id && custom.detail.id !== modalId) {
				if (editTarget) setEditTarget(null);
				if (viewTarget) setViewTarget(null);
			}
		};
		window.addEventListener("pp-admin-modal-open", handler);
		return () => window.removeEventListener("pp-admin-modal-open", handler);
	}, [modalId, editTarget, viewTarget]);

	useEffect(() => {
		if (!editTarget && !viewTarget) return;
		window.dispatchEvent(new CustomEvent("pp-admin-modal-open", { detail: { id: modalId } }));
	}, [modalId, editTarget, viewTarget]);

	useEffect(() => {
		if (typeof window === "undefined" || (!editTarget && !viewTarget)) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setEditTarget(null);
				setViewTarget(null);
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [editTarget, viewTarget]);

	const fetchOrders = useCallback(
		async (
			nextQuery: string,
			nextPage: number,
			nextSort: string[],
			nextDir: Array<"asc" | "desc">,
			nextStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled",
			options?: { prefetch?: boolean; force?: boolean }
		) => {
			const key = getCacheKey(nextQuery, nextPage, nextSort, nextDir, nextStatus, rowsPerPage);
			if (!options?.prefetch) {
				const cached = cacheRef.current.get(key);
				if (cached && !options?.force) {
					setOrders(cached.items);
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
			const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
			if (response.ok) {
				const data = (await response.json()) as { items: OrderRow[]; total: number };
				cacheRef.current.set(key, data);
				if (!options?.prefetch) {
					setOrders(data.items);
					setTotal(data.total);
				}
			} else if (!options?.prefetch) {
				setOrders([]);
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
			fetchOrders(query, nextPage, sort, dir, status);
			setPage(nextPage);
			syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
		}, 300);
		return () => window.clearTimeout(handle);
	}, [query, rowsPerPage, sort, dir, status, fetchOrders, syncUrl]);

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
				status?: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered" | "WhatsApp Intent" | "Cancelled";
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
				fetchOrders(nextQuery, nextPage, nextSort, nextDir, nextStatus);
				syncUrl(nextQuery, nextPage, nextSort, nextDir, nextStatus, nextRows);
			}, 0);
		} catch {
			restoredRef.current = false;
			window.sessionStorage.removeItem(storageKey);
		}
	}, [dir, fetchOrders, page, query, rowsPerPage, sort, status, syncUrl]);

	useEffect(() => {
		setSelectedIds(new Set());
	}, [orders]);

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
			fetchOrders(query, page + 1, sort, dir, status, { prefetch: true });
		}
		if (page > 1) {
			fetchOrders(query, page - 1, sort, dir, status, { prefetch: true });
		}
	}, [page, total, rowsPerPage, query, sort, dir, status, fetchOrders, loading, shouldPrefetch]);

	const refresh = useCallback(
		(options?: { resetPage?: boolean }) => {
			const nextPage = options?.resetPage ? 1 : page;
			fetchOrders(query, nextPage, sort, dir, status, { force: true });
			if (options?.resetPage) {
				setPage(nextPage);
				syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
			}
		},
		[fetchOrders, page, query, rowsPerPage, sort, dir, status, syncUrl]
	);

	useEffect(() => {
		registerRefresh?.(refresh);
	}, [registerRefresh, refresh]);

	const handlePageChange = (nextPage: number) => {
		fetchOrders(query, nextPage, sort, dir, status);
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
		fetchOrders(query, nextPage, nextSort, nextDir, status);
		syncUrl(query, nextPage, nextSort, nextDir, status, rowsPerPage);
	};

	const handleRowsChange = (nextRows: number) => {
		const nextPage = 1;
		setRowsPerPage(nextRows);
		setPage(nextPage);
		fetchOrders(query, nextPage, sort, dir, status);
		syncUrl(query, nextPage, sort, dir, status, nextRows);
	};

	const handleDelete = (target: OrderRow) => {
		setDeleteTarget(target);
	};

	const handleUpdateStatus = async (id: string, nextStatus: string) => {
		setUpdatingStatusId(id);
		// Optimistic update
		setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));
		try {
			const res = await fetch(`/api/orders/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ status: nextStatus }),
				headers: { "Content-Type": "application/json" },
			});
			if (!res.ok) throw new Error("Failed to update status");
			toastContext?.pushToast({ message: "Status updated.", type: "success" });
			
			// Refresh to ensure integrity after 1s
			setTimeout(() => {
				fetchOrders(query, page, sort, dir, status, { force: true });
			}, 1000);
		} catch {
			toastContext?.pushToast({ message: "Failed to update status.", type: "error" });
			// Revert on failure
			fetchOrders(query, page, sort, dir, status, { force: true });
		} finally {
			setUpdatingStatusId(null);
		}
	};

	const handleSelect = (id: string, selected: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (selected) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const openEdit = (order: OrderRow) => {
		setEditError(null);
		setFieldErrors({});
		setEditTarget(order);
		setEditName(order.customerName === "WhatsApp Order" ? "" : order.customerName);
		setEditPhone(order.phone === "-" ? "" : order.phone);
	};

	const handleEditSave = async (event?: React.FormEvent) => {
		if (event) event.preventDefault();
		if (!editTarget) return;

		setEditLoading(true);
		setEditError(null);
		setFieldErrors({});

		const nextName = editName.trim();
		const nextPhone = editPhone.trim();

		const nextErrors = buildFieldErrors<"customerName" | "phone">([
			{ key: "customerName", error: validateRequired(nextName, "Customer name") },
			{ key: "phone", error: validatePhone(nextPhone) },
		]);

		if (Object.keys(nextErrors).length > 0) {
			setFieldErrors(nextErrors);
			focusFirstInvalid(nextErrors, [
				{ key: "customerName", selector: "#admin-order-edit-name" },
				{ key: "phone", selector: "#admin-order-edit-phone" },
			]);
			setEditLoading(false);
			return;
		}

		try {
			const response = await fetch(`/api/orders/${editTarget.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					customerName: nextName || "WhatsApp Order", 
					phone: nextPhone || "-" 
				}),
			});
			setEditLoading(false);
			if (!response.ok) {
				setEditError("Unable to update order. Please try again.");
				return;
			}
			
			setEditTarget(null);
			setEditError(null);
			toastContext?.pushToast({ message: "Customer details updated.", type: "success" });
			
			// Update optimistic locally
			setOrders((prev) =>
				prev.map((o) =>
					o.id === editTarget.id
						? { ...o, customerName: nextName || "WhatsApp Order", phone: nextPhone || "-" }
						: o
				)
			);
			cacheRef.current.clear();
		} catch {
			setEditLoading(false);
			setEditError("Network error. Please try again.");
		}
	};

	const handleSelectAll = (selected: boolean) => {
		if (selected) {
			setSelectedIds(new Set(orders.map((o) => o.id)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleBulkDelete = async () => {
		if (selectedIds.size === 0) return;
		if (!confirm(`Delete ${selectedIds.size} orders?`)) return;
		setBulkLoading(true);
		try {
			const res = await fetch("/api/admin/orders", {
				method: "DELETE",
				body: JSON.stringify({ ids: Array.from(selectedIds) }),
				headers: { "Content-Type": "application/json" },
			});
			if (!res.ok) throw new Error("Failed to delete orders");
			toastContext?.pushToast({ message: "Orders deleted.", type: "success" });
			setSelectedIds(new Set());
			fetchOrders(query, page, sort, dir, status, { force: true });
			if (page > 1 && orders.length === selectedIds.size) setPage(page - 1);
		} catch {
			toastContext?.pushToast({ message: "Failed to delete orders.", type: "error" });
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkUpdateStatus = async (nextStatus: string) => {
		if (selectedIds.size === 0 || !nextStatus) return;
		setBulkLoading(true);
		try {
			const res = await fetch("/api/admin/orders", {
				method: "PATCH",
				body: JSON.stringify({ ids: Array.from(selectedIds), status: nextStatus }),
				headers: { "Content-Type": "application/json" },
			});
			if (!res.ok) throw new Error("Failed to update status");
			toastContext?.pushToast({ message: "Orders updated.", type: "success" });
			setSelectedIds(new Set());
			fetchOrders(query, page, sort, dir, status, { force: true });
		} catch {
			toastContext?.pushToast({ message: "Failed to update orders.", type: "error" });
		} finally {
			setBulkLoading(false);
		}
	};

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		await fetch(`/api/orders/${deleteTarget.id}`, { method: "DELETE" });
		setDeleteLoading(false);
		setDeleteTarget(null);
		const nextPage = orders.length <= 1 && page > 1 ? page - 1 : page;
		setPage(nextPage);
		fetchOrders(query, nextPage, sort, dir, status, { force: true });
		syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
	};

	return (
		<div className="grid gap-4">
			<AdminConfirmModal
				open={Boolean(deleteTarget)}
				title="Delete order?"
				description={
					deleteTarget
						? `This will remove the order from ${deleteTarget.customerName}.`
						: undefined
				}
				confirmLabel="Delete"
				status="danger"
				destructive
				onConfirm={confirmDelete}
				onCancel={() => setDeleteTarget(null)}
				loading={deleteLoading}
			/>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Orders</p>
					<div className="flex items-center gap-2">
						<h2 className="text-2xl font-[var(--font-heading)]">All orders</h2>
						<button
							type="button"
							onClick={() => fetchOrders(query, page, sort, dir, status, { force: true })}
							disabled={loading || bulkLoading || deleteLoading}
							className="rounded-md p-1.5 text-[var(--pp-muted)] transition hover:bg-[var(--pp-beige)] hover:text-[var(--pp-ink)] disabled:opacity-50"
							title="Refresh orders"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[var(--pp-gold)]" : ""}`} />
						</button>
					</div>
				</div>
				<div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
					<div className="flex w-full flex-wrap items-end gap-2 sm:max-w-[28rem]">
						<div className="flex w-full items-center gap-2 sm:flex-1">
							<label htmlFor="admin-orders-search" className="sr-only">
								Search orders
							</label>
							<input
								id="admin-orders-search"
								value={query}
								onChange={(event) => {
									userTypedRef.current = true;
									setQuery(event.target.value);
								}}
								placeholder="Search orders"
								className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
							/>
						</div>
						<div className="w-full sm:w-auto">
							<AdminSelect
								value={status}
								onChange={(nextValue) => {
									const nextStatus = nextValue as AdminOrdersClientProps["initialStatus"];
									setStatus(nextStatus);
									const nextPage = 1;
									setPage(nextPage);
									fetchOrders(query, nextPage, sort, dir, nextStatus);
									syncUrl(query, nextPage, sort, dir, nextStatus, rowsPerPage);
								}}
								options={[
									{ value: "all", label: "All statuses" },
									{ value: "WhatsApp Intent", label: "WhatsApp Intent" },
									{ value: "Pending", label: "Pending" },
									{ value: "Confirmed", label: "Confirmed" },
									{ value: "Shipped", label: "Shipped" },
									{ value: "Delivered", label: "Delivered" },
									{ value: "Cancelled", label: "Cancelled" }
								]}
								header="Status"
								buttonClassName="h-10 w-full border border-[var(--pp-border)] bg-white px-3 py-2 text-xs"
							/>
						</div>
					</div>
					{onOpenCreate && (
						<button
							type="button"
							onClick={onOpenCreate}
							className="btn-primary admin-btn admin-btn-size w-full sm:w-auto"
						>
							<span className="admin-btn-label">Create manual order</span>
						</button>
					)}
				</div>
			</div>
			{selectedIds.size > 0 && (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--pp-gold)]/20 bg-[var(--pp-gold)]/5 p-3 animate-in fade-in slide-in-from-top-2">
					<span className="text-sm font-semibold text-[var(--pp-ink)]">{selectedIds.size} selected</span>
					<div className="flex items-center gap-2">
						<AdminSelect
							value=""
							onChange={(val) => handleBulkUpdateStatus(String(val))}
							options={[
								{ value: "", label: "Update status..." },
								{ value: "WhatsApp Intent", label: "WhatsApp Intent" },
								{ value: "Pending", label: "Pending" },
								{ value: "Confirmed", label: "Confirmed" },
								{ value: "Shipped", label: "Shipped" },
								{ value: "Delivered", label: "Delivered" },
								{ value: "Cancelled", label: "Cancelled" }
							]}
							disabled={bulkLoading}
							buttonClassName="h-9 border border-[var(--pp-border)] bg-white px-3 py-1 text-xs"
						/>
						<button
							onClick={handleBulkDelete}
							disabled={bulkLoading}
							className="btn-round group flex h-9 items-center gap-1.5 border border-red-200 bg-white px-3 py-1 text-xs text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
						>
							<Trash2 className="h-3.5 w-3.5" />
							Delete
						</button>
					</div>
				</div>
			)}
			<AdminOrdersTable
				orders={orders}
				page={page}
				pageSize={rowsPerPage}
				total={total}
				query={query}
				sort={sort}
				dir={dir}
				onSort={handleSort}
				onPageChange={handlePageChange}
				onDelete={(id) => {
					const target = orders.find((order) => order.id === id);
					if (target) handleDelete(target);
				}}
				onView={setViewTarget}
				onEdit={openEdit}
				onUpdateStatus={handleUpdateStatus}
				updatingStatusId={updatingStatusId}
				selectedIds={selectedIds}
				onSelect={handleSelect}
				onSelectAll={handleSelectAll}
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

			{viewTarget && (
				<div className="fixed inset-0 z-50 bg-black/40 animate-in fade-in" onClick={() => setViewTarget(null)}>
					<div className="flex h-full w-full items-center justify-center p-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
						<div
							className="w-full max-w-2xl bg-white rounded-2xl shadow-xl animate-in zoom-in-95"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between border-b border-[var(--pp-border)] p-6">
								<div>
									<h3 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
										Order {viewTarget.orderNumber || "Legacy"}
									</h3>
									<p className="text-sm text-[var(--pp-muted)] mt-1">
										placed on {new Date(viewTarget.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long", timeStyle: "short" })}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setViewTarget(null)}
									className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[var(--pp-muted)] transition hover:bg-gray-200 hover:text-[var(--pp-ink)]"
									aria-label="Close modal"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							<div className="p-6">
								<div className="grid grid-cols-2 gap-6 mb-8 rounded-xl bg-[var(--pp-beige)]/30 p-5 border border-[var(--pp-border)]">
									<div>
										<h4 className="text-xs uppercase tracking-[0.1em] text-[var(--pp-muted)] mb-2 font-semibold">Customer</h4>
										<p className="font-semibold text-base text-[var(--pp-ink)]">{viewTarget.customerName}</p>
										<p className="text-sm text-[var(--pp-muted)] mt-1">{viewTarget.phone}</p>
									</div>
									<div className="text-right">
										<h4 className="text-xs uppercase tracking-[0.1em] text-[var(--pp-muted)] mb-2 font-semibold">Status</h4>
										<span className="inline-flex items-center px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-white border border-[var(--pp-border)] rounded-full text-[var(--pp-ink)] shadow-sm">
											{viewTarget.status}
										</span>
									</div>
								</div>

								<h4 className="text-xs uppercase tracking-[0.1em] font-semibold text-[var(--pp-muted)] mb-3">Line Items</h4>
								<div className="bg-white rounded-xl border border-[var(--pp-border)] shadow-sm max-h-[35vh] overflow-y-auto overflow-x-hidden">
									<table className="w-full text-sm text-left">
										<thead className="text-xs uppercase tracking-wider text-[var(--pp-muted)] border-b border-[var(--pp-border)] bg-gray-50/50">
											<tr>
												<th className="py-3 px-4 font-semibold">Product</th>
												<th className="py-3 px-4 text-center font-semibold">Qty</th>
												<th className="py-3 px-4 text-right font-semibold">Price</th>
												<th className="py-3 px-4 text-right font-semibold">Subtotal</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[var(--pp-border)]">
											{viewTarget.orderItems?.length ? viewTarget.orderItems.map((item) => (
												<tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
													<td className="py-4 px-4 font-medium text-[var(--pp-ink)]">{item.productName}</td>
													<td className="py-4 px-4 text-center">
														<span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--pp-beige)] text-xs font-bold text-[var(--pp-ink)]">
															{item.quantity}
														</span>
													</td>
													<td className="py-4 px-4 text-right text-[var(--pp-muted)]">{formatCurrency(item.priceAtTime)}</td>
													<td className="py-4 px-4 text-right font-semibold text-[var(--pp-ink)]">{formatCurrency(item.priceAtTime * item.quantity)}</td>
												</tr>
											)) : (
												<tr>
													<td colSpan={4} className="py-6 text-center text-[var(--pp-muted)] italic">
														No items explicitly logged (legacy record).
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>

								<div className="flex justify-between items-center bg-gray-900 text-white rounded-xl p-5 border border-[var(--pp-border)] mt-6 shadow-md transition-transform hover:scale-[1.01]">
									<span className="font-semibold tracking-wide">Total Amount</span>
									<span className="text-2xl font-bold">{formatCurrency(viewTarget.totalAmount)}</span>
								</div>

								<div className="mt-8 flex justify-end">
									<button
										onClick={() => setViewTarget(null)}
										className="btn-outline font-semibold px-6 py-2.5 hover:bg-gray-100"
									>
										Close
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{editTarget && (
				<div className="fixed inset-0 z-50 bg-black/40" onClick={() => setEditTarget(null)}>
					<div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
						<div
							className="w-full max-w-lg bg-white rounded-lg p-6 shadow-lg"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-[var(--font-heading)]">Edit Customer Details</h3>
								<button
									type="button"
									onClick={() => setEditTarget(null)}
									className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
									aria-label="Close modal"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
							<form onSubmit={handleEditSave} className="mt-4 grid gap-4" noValidate>
								<div className="grid gap-2">
									<label htmlFor="admin-order-edit-name" className="admin-label">
										Customer name
										<RequiredMark />
									</label>
									<input
										id="admin-order-edit-name"
										className={`admin-input ${fieldErrors.customerName ? "is-error" : ""}`}
										value={editName}
										onChange={(event) => {
											setEditName(event.target.value);
											if (fieldErrors.customerName) clearFieldError("customerName");
										}}
										onBlur={(event) => {
											if (!fieldErrors.customerName) return;
											const result = validateRequired(event.target.value, "Customer name");
											if (!result) setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
										}}
										placeholder="Customer name"
									/>
									<span
										data-show={Boolean(fieldErrors.customerName)}
										className="field-error text-xs normal-case text-red-600"
									>
										{fieldErrors.customerName ?? ""}
									</span>
								</div>
								<div className="grid gap-2">
									<label htmlFor="admin-order-edit-phone" className="admin-label">
										Phone number
										<RequiredMark />
									</label>
									<input
										id="admin-order-edit-phone"
										className={`admin-input ${fieldErrors.phone ? "is-error" : ""}`}
										value={editPhone}
										onChange={(event) => {
											setEditPhone(event.target.value);
											if (fieldErrors.phone) clearFieldError("phone");
										}}
										onBlur={(event) => {
											if (!fieldErrors.phone) return;
											const result = validatePhone(event.target.value);
											if (!result) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
										}}
										placeholder="Phone number"
									/>
									<span
										data-show={Boolean(fieldErrors.phone)}
										className="field-error text-xs normal-case text-red-600"
									>
										{fieldErrors.phone ?? ""}
									</span>
								</div>
								<div className="mt-4 flex items-center justify-end gap-3">
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => setEditTarget(null)}
										disabled={editLoading}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="btn-primary admin-btn admin-btn-size"
										disabled={editLoading}
									>
										{editLoading ? "Saving…" : "Save details"}
									</button>
								</div>
								{editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
							</form>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
