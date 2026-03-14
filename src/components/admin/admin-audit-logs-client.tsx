"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Prisma } from "@prisma/client";
import AdminAuditLogsTable from "@/components/admin/admin-audit-logs-table";
import AdminSelect from "@/components/admin/admin-select";

interface AuditLogRow {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.JsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface AdminAuditLogsClientProps {
  initialLogs: AuditLogRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialQuery: string;
  initialSort: string[];
  initialDir: Array<"asc" | "desc">;
  initialAction: "all" | string;
  initialEntity: "all" | string;
}

const actionOptions = [
  { value: "all", label: "All actions" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "UPLOAD", label: "Upload" },
];

const entityOptions = [
  { value: "all", label: "All entities" },
  { value: "AUTH", label: "Auth" },
  { value: "PRODUCT", label: "Product" },
  { value: "CATEGORY", label: "Category" },
  { value: "ORDER", label: "Order" },
  { value: "MEDIA", label: "Media" },
  { value: "PASSWORD", label: "Password" },
];

const buildQueryString = (
  query: string,
  page: number,
  sort: string[],
  dir: Array<"asc" | "desc">,
  action: string,
  entity: string,
  pageSize: number,
  defaults: {
    sort: string;
    dir: "asc" | "desc";
    pageSize: number;
    action: string;
    entity: string;
  }
) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (sort[0] && sort[0] !== defaults.sort) params.set("sort", sort[0]);
  if (dir[0] && dir[0] !== defaults.dir) params.set("dir", dir[0]);
  if (action !== defaults.action) params.set("action", action);
  if (entity !== defaults.entity) params.set("entity", entity);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== defaults.pageSize) params.set("pageSize", String(pageSize));
  return params.toString();
};

export default function AdminAuditLogsClient({
  initialLogs,
  initialTotal,
  initialPage,
  pageSize,
  initialQuery,
  initialSort,
  initialDir,
  initialAction,
  initialEntity,
}: AdminAuditLogsClientProps) {
  const storageKey = "admin-audit-logs-state";
  const shouldPrefetch = process.env.NODE_ENV === "production";
  const [logs, setLogs] = useState(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [action, setAction] = useState(initialAction);
  const [entity, setEntity] = useState(initialEntity);
  const [sort, setSort] = useState(initialSort);
  const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const userTypedRef = useRef(false);
  const cacheRef = useRef(new Map<string, { items: AuditLogRow[]; total: number }>());
  const restoredRef = useRef(false);

  const defaults = useMemo(
    () => ({
      sort: initialSort[0] ?? "createdAt",
      dir: (initialDir[0] ?? "desc") as "asc" | "desc",
      pageSize,
      action: initialAction,
      entity: initialEntity,
    }),
    [initialSort, initialDir, pageSize, initialAction, initialEntity]
  );

  const syncUrl = useCallback(
    (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      nextAction: string,
      nextEntity: string,
      nextPageSize: number
    ) => {
      if (typeof window === "undefined") return;
      const params = buildQueryString(
        nextQuery,
        nextPage,
        nextSort,
        nextDir,
        nextAction,
        nextEntity,
        nextPageSize,
        defaults
      );
      const url = params ? `/admin/audit-logs?${params}` : "/admin/audit-logs";
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
      nextAction: string,
      nextEntity: string,
      nextPageSize: number
    ) =>
      [
        nextQuery.trim(),
        nextPage,
        nextSort[0] ?? "",
        nextDir[0] ?? "",
        nextAction,
        nextEntity,
        nextPageSize,
      ].join("|"),
    []
  );

  const fetchLogs = useCallback(
    async (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      nextAction: string,
      nextEntity: string,
      options?: { prefetch?: boolean }
    ) => {
      const key = getCacheKey(
        nextQuery,
        nextPage,
        nextSort,
        nextDir,
        nextAction,
        nextEntity,
        rowsPerPage
      );
      if (!options?.prefetch) {
        const cached = cacheRef.current.get(key);
        if (cached) {
          setLogs(cached.items);
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
        nextAction,
        nextEntity,
        rowsPerPage,
        defaults
      );
      const response = await fetch(`/api/admin/audit-logs?${params}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { items: AuditLogRow[]; total: number };
        cacheRef.current.set(key, data);
        if (!options?.prefetch) {
          setLogs(data.items);
          setTotal(data.total);
        }
      } else if (!options?.prefetch) {
        setLogs([]);
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
      fetchLogs(query, nextPage, sort, dir, action, entity);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, action, entity, rowsPerPage);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, rowsPerPage, sort, dir, action, entity, fetchLogs, syncUrl]);

  useEffect(() => {
    if (!shouldPrefetch) return;
    if (loading) return;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    if (page < totalPages) {
      fetchLogs(query, page + 1, sort, dir, action, entity, { prefetch: true });
    }
    if (page > 1) {
      fetchLogs(query, page - 1, sort, dir, action, entity, { prefetch: true });
    }
  }, [page, total, rowsPerPage, query, sort, dir, action, entity, fetchLogs, loading, shouldPrefetch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const hasParams =
      params.has("q") ||
      params.has("sort") ||
      params.has("dir") ||
      params.has("action") ||
      params.has("entity") ||
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
        action?: string;
        entity?: string;
        rowsPerPage?: number;
      };
      const nextQuery = parsed.query ?? query;
      const nextPage = parsed.page ?? page;
      const nextSort = parsed.sort ?? sort;
      const nextDir = parsed.dir ?? dir;
      const nextAction = parsed.action ?? action;
      const nextEntity = parsed.entity ?? entity;
      const nextRows = parsed.rowsPerPage ?? rowsPerPage;
      window.setTimeout(() => {
        setQuery(nextQuery);
        setPage(nextPage);
        setSort(nextSort);
        setDir(nextDir);
        setAction(nextAction);
        setEntity(nextEntity);
        setRowsPerPage(nextRows);
        fetchLogs(nextQuery, nextPage, nextSort, nextDir, nextAction, nextEntity);
        syncUrl(nextQuery, nextPage, nextSort, nextDir, nextAction, nextEntity, nextRows);
      }, 0);
    } catch {
      restoredRef.current = false;
      window.sessionStorage.removeItem(storageKey);
    }
  }, [dir, fetchLogs, page, query, rowsPerPage, sort, action, entity, syncUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      query,
      page,
      sort,
      dir,
      action,
      entity,
      rowsPerPage,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [query, page, sort, dir, action, entity, rowsPerPage]);

  const handlePageChange = (nextPage: number) => {
    fetchLogs(query, nextPage, sort, dir, action, entity);
    setPage(nextPage);
    syncUrl(query, nextPage, sort, dir, action, entity, rowsPerPage);
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
    fetchLogs(query, nextPage, nextSort, nextDir, action, entity);
    syncUrl(query, nextPage, nextSort, nextDir, action, entity, rowsPerPage);
  };

  const handleRowsChange = (nextRows: number) => {
    const nextPage = 1;
    setRowsPerPage(nextRows);
    setPage(nextPage);
    fetchLogs(query, nextPage, sort, dir, action, entity);
    syncUrl(query, nextPage, sort, dir, action, entity, nextRows);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Security</p>
          <h2 className="text-2xl font-[var(--font-heading)]">Audit logs</h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full flex-wrap items-end gap-3 sm:max-w-[32rem]">
            <div className="flex w-full items-center gap-2 sm:flex-1">
              <label htmlFor="admin-audit-search" className="sr-only">
                Search audit logs
              </label>
              <input
                id="admin-audit-search"
                value={query}
                onChange={(event) => {
                  userTypedRef.current = true;
                  setQuery(event.target.value);
                }}
                placeholder="Search logs"
                className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
              />
            </div>
            <div className="w-full sm:min-w-[150px] sm:w-auto">
              <AdminSelect
                value={action}
                onChange={(nextValue) => {
                  const nextAction = String(nextValue);
                  setAction(nextAction);
                  const nextPage = 1;
                  setPage(nextPage);
                  fetchLogs(query, nextPage, sort, dir, nextAction, entity);
                  syncUrl(query, nextPage, sort, dir, nextAction, entity, rowsPerPage);
                }}
                options={actionOptions}
                header="Action"
                buttonClassName="h-10 w-full border border-[var(--pp-border)] bg-white px-3 py-2 text-xs"
              />
            </div>
            <div className="w-full sm:min-w-[150px] sm:w-auto">
              <AdminSelect
                value={entity}
                onChange={(nextValue) => {
                  const nextEntity = String(nextValue);
                  setEntity(nextEntity);
                  const nextPage = 1;
                  setPage(nextPage);
                  fetchLogs(query, nextPage, sort, dir, action, nextEntity);
                  syncUrl(query, nextPage, sort, dir, action, nextEntity, rowsPerPage);
                }}
                options={entityOptions}
                header="Entity"
                buttonClassName="h-10 w-full border border-[var(--pp-border)] bg-white px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <AdminAuditLogsTable
        logs={logs}
        page={page}
        pageSize={rowsPerPage}
        total={total}
        query={query}
        sort={sort}
        dir={dir}
        onSort={handleSort}
        onPageChange={handlePageChange}
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
