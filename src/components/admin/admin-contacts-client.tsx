"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminContactsTable from "@/components/admin/admin-contacts-table";
import AdminSelect from "@/components/admin/admin-select";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

interface AdminContactsClientProps {
  initialContacts: ContactRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialQuery: string;
  initialSort: string[];
  initialDir: Array<"asc" | "desc">;
}

const buildQueryString = (
  query: string,
  page: number,
  sort: string[],
  dir: Array<"asc" | "desc">,
  pageSize: number,
  defaults: { sort: string; dir: "asc" | "desc"; pageSize: number }
) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (sort[0] && sort[0] !== defaults.sort) params.set("sort", sort[0]);
  if (dir[0] && dir[0] !== defaults.dir) params.set("dir", dir[0]);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== defaults.pageSize) params.set("pageSize", String(pageSize));
  return params.toString();
};

export default function AdminContactsClient({
  initialContacts,
  initialTotal,
  initialPage,
  pageSize,
  initialQuery,
  initialSort,
  initialDir,
}: AdminContactsClientProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const userTypedRef = useRef(false);
  const defaults = useMemo(
    () => ({
      sort: initialSort[0] ?? "createdAt",
      dir: (initialDir[0] ?? "desc") as "asc" | "desc",
      pageSize,
    }),
    [initialSort, initialDir, pageSize]
  );

  const syncUrl = useCallback(
    (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      nextPageSize: number
    ) => {
      if (typeof window === "undefined") return;
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, nextPageSize, defaults);
      const url = params ? `/admin/contacts?${params}` : "/admin/contacts";
      window.history.replaceState(null, "", url);
    },
    [defaults]
  );

  const fetchContacts = useCallback(
    async (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">
    ) => {
      setLoading(true);
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, rowsPerPage, defaults);
      const response = await fetch(`/api/admin/contacts?${params}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { items: ContactRow[]; total: number };
        setContacts(data.items);
        setTotal(data.total);
      } else {
        setContacts([]);
        setTotal(0);
      }
      setLoading(false);
    },
    [defaults, rowsPerPage]
  );

  useEffect(() => {
    if (!userTypedRef.current) return;
    const handle = window.setTimeout(() => {
      const nextPage = 1;
      fetchContacts(query, nextPage, sort, dir);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, rowsPerPage, sort, dir, fetchContacts, syncUrl]);

  const handlePageChange = (nextPage: number) => {
    fetchContacts(query, nextPage, sort, dir);
    setPage(nextPage);
    syncUrl(query, nextPage, sort, dir, rowsPerPage);
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
    fetchContacts(query, nextPage, nextSort, nextDir);
    syncUrl(query, nextPage, nextSort, nextDir, rowsPerPage);
  };

  const handleRowsChange = (nextRows: number) => {
    const nextPage = 1;
    setRowsPerPage(nextRows);
    setPage(nextPage);
    fetchContacts(query, nextPage, sort, dir);
    syncUrl(query, nextPage, sort, dir, nextRows);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Inbox</p>
          <h2 className="text-2xl font-[var(--font-heading)]">Contact messages</h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full items-center gap-2 sm:max-w-xs">
            <label htmlFor="admin-contacts-search" className="sr-only">
              Search contacts
            </label>
            <input
              id="admin-contacts-search"
              value={query}
              onChange={(event) => {
                userTypedRef.current = true;
                setQuery(event.target.value);
              }}
              placeholder="Search contacts"
              className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
            />
          </div>
        </div>
      </div>
      <AdminContactsTable
        contacts={contacts}
        page={page}
        pageSize={rowsPerPage}
        total={total}
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
            buttonClassName="border border-[var(--pp-border)] bg-white px-3 py-1 text-xs"
          />
          </div>
        }
      />
    </div>
  );
}
