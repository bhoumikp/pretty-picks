"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminOrdersTable from "@/components/admin/admin-orders-table";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";
import AdminSelect from "@/components/admin/admin-select";

interface OrderRow {
  id: string;
  productName?: string | null;
  customerName: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface AdminOrdersClientProps {
  initialOrders: OrderRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialQuery: string;
  initialSort: string[];
  initialDir: Array<"asc" | "desc">;
  initialStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered";
  onOpenCreate?: () => void;
  registerRefresh?: (fn: (options?: { resetPage?: boolean }) => void) => void;
}

const buildQueryString = (
  query: string,
  page: number,
  sort: string[],
  dir: Array<"asc" | "desc">,
  status: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered",
  pageSize: number,
  defaults: {
    sort: string;
    dir: "asc" | "desc";
    pageSize: number;
    status: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered";
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
  const [status, setStatus] = useState<"all" | "Pending" | "Confirmed" | "Shipped" | "Delivered">(
    initialStatus
  );
  const [sort, setSort] = useState(initialSort);
  const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
      nextStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered",
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
      nextStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered",
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

  const fetchOrders = useCallback(
    async (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      nextStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered",
      options?: { prefetch?: boolean; force?: boolean }
    ) => {
      const key = getCacheKey(nextQuery, nextPage, nextSort, nextDir, nextStatus, rowsPerPage);
      if (!options?.prefetch && !options?.force) {
        const cached = cacheRef.current.get(key);
        if (cached) {
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
        status?: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered";
        rowsPerPage?: number;
      };
      const nextQuery = parsed.query ?? query;
      const nextPage = parsed.page ?? page;
      const nextSort = parsed.sort ?? sort;
      const nextDir = parsed.dir ?? dir;
      const nextStatus = parsed.status ?? status;
      const nextRows = parsed.rowsPerPage ?? rowsPerPage;
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
          <h2 className="text-2xl font-[var(--font-heading)]">All orders</h2>
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
                  { value: "Pending", label: "Pending" },
                  { value: "Confirmed", label: "Confirmed" },
                  { value: "Shipped", label: "Shipped" },
                  { value: "Delivered", label: "Delivered" },
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
