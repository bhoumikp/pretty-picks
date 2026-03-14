"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminContactsTable from "@/components/admin/admin-contacts-table";
import AdminSelect from "@/components/admin/admin-select";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  readAt?: string | null;
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
  const storageKey = "admin-contacts-state";
  const shouldPrefetch = process.env.NODE_ENV === "production";
  const [contacts, setContacts] = useState(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [openContact, setOpenContact] = useState<ContactRow | null>(null);
  const [closing, setClosing] = useState(false);
  const userTypedRef = useRef(false);
  const restoredRef = useRef(false);
  const cacheRef = useRef(new Map<string, { items: ContactRow[]; total: number }>());
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

  const getCacheKey = useCallback(
    (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      nextPageSize: number
    ) =>
      [nextQuery.trim(), nextPage, nextSort[0] ?? "", nextDir[0] ?? "", nextPageSize].join("|"),
    []
  );

  const fetchContacts = useCallback(
    async (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      options?: { prefetch?: boolean; force?: boolean }
    ) => {
      const key = getCacheKey(nextQuery, nextPage, nextSort, nextDir, rowsPerPage);
      if (!options?.prefetch) {
        const cached = cacheRef.current.get(key);
        if (cached && !options?.force) {
          setContacts(cached.items);
          setTotal(cached.total);
          return;
        }
        setLoading(true);
      }
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, rowsPerPage, defaults);
      const response = await fetch(`/api/admin/contacts?${params}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { items: ContactRow[]; total: number };
        cacheRef.current.set(key, data);
        if (!options?.prefetch) {
          setContacts(data.items);
          setTotal(data.total);
        }
      } else if (!options?.prefetch) {
        setContacts([]);
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
      fetchContacts(query, nextPage, sort, dir);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, rowsPerPage, sort, dir, fetchContacts, syncUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoredRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const hasParams =
      params.has("q") ||
      params.has("sort") ||
      params.has("dir") ||
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
        rowsPerPage?: number;
      };
      const nextQuery = parsed.query ?? query;
      const nextPage = parsed.page ?? page;
      const nextSort = parsed.sort ?? sort;
      const nextDir = parsed.dir ?? dir;
      const nextRows = parsed.rowsPerPage ?? rowsPerPage;
      window.setTimeout(() => {
        setQuery(nextQuery);
        setPage(nextPage);
        setSort(nextSort);
        setDir(nextDir);
        setRowsPerPage(nextRows);
        fetchContacts(nextQuery, nextPage, nextSort, nextDir);
        syncUrl(nextQuery, nextPage, nextSort, nextDir, nextRows);
      }, 0);
    } catch {
      restoredRef.current = false;
      window.sessionStorage.removeItem(storageKey);
    }
  }, [dir, fetchContacts, page, query, rowsPerPage, sort, syncUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      query,
      page,
      sort,
      dir,
      rowsPerPage,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [query, page, sort, dir, rowsPerPage]);

  useEffect(() => {
    if (!shouldPrefetch) return;
    if (loading) return;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    if (page < totalPages) {
      fetchContacts(query, page + 1, sort, dir, { prefetch: true });
    }
    if (page > 1) {
      fetchContacts(query, page - 1, sort, dir, { prefetch: true });
    }
  }, [page, total, rowsPerPage, query, sort, dir, fetchContacts, loading, shouldPrefetch]);

  const markContactRead = useCallback(async (contactId: string) => {
    await fetch("/api/admin/contacts/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [contactId] }),
    });
    window.dispatchEvent(new Event("pp-contacts-refresh"));
  }, []);

  const markContactUnread = useCallback(async (contactId: string) => {
    await fetch("/api/admin/contacts/mark-unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [contactId] }),
    });
    window.dispatchEvent(new Event("pp-contacts-refresh"));
  }, []);

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

  const handleOpen = useCallback(
    (contact: ContactRow) => {
      setClosing(false);
      if (!contact.readAt) {
        const timestamp = new Date().toISOString();
        setOpenContact({ ...contact, readAt: timestamp });
        setContacts((prev) =>
          prev.map((row) => (row.id === contact.id ? { ...row, readAt: timestamp } : row))
        );
        window.dispatchEvent(new CustomEvent("pp-contacts-unread-delta", { detail: { delta: -1 } }));
        markContactRead(contact.id).catch(() => undefined);
        return;
      }
      setOpenContact(contact);
    },
    [markContactRead]
  );

  const handleClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setOpenContact(null);
    }, 220);
  }, []);

  const handleMarkUnread = useCallback(
    (contactId: string) => {
      setContacts((prev) =>
        prev.map((row) => (row.id === contactId ? { ...row, readAt: null } : row))
      );
      setOpenContact((prev) => (prev?.id === contactId ? { ...prev, readAt: null } : prev));
      window.dispatchEvent(new CustomEvent("pp-contacts-unread-delta", { detail: { delta: 1 } }));
      markContactUnread(contactId).catch(() => undefined);
    },
    [markContactUnread]
  );

  const handleMarkRead = useCallback(
    (contactId: string) => {
      const timestamp = new Date().toISOString();
      setContacts((prev) =>
        prev.map((row) => (row.id === contactId ? { ...row, readAt: timestamp } : row))
      );
      setOpenContact((prev) => (prev?.id === contactId ? { ...prev, readAt: timestamp } : prev));
      window.dispatchEvent(new CustomEvent("pp-contacts-unread-delta", { detail: { delta: -1 } }));
      markContactRead(contactId).catch(() => undefined);
    },
    [markContactRead]
  );

  useEffect(() => {
    if (!openContact) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, openContact]);

  useEffect(() => {
    const handler = () => {
      const nextPage = 1;
      fetchContacts(query, nextPage, sort, dir, { force: true });
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    };
    window.addEventListener("pp-contacts-reload", handler);
    return () => window.removeEventListener("pp-contacts-reload", handler);
  }, [dir, fetchContacts, query, rowsPerPage, sort, syncUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldForce = window.sessionStorage.getItem("pp-contacts-force-refresh");
    if (!shouldForce) return;
    window.sessionStorage.removeItem("pp-contacts-force-refresh");
    const nextPage = 1;
    fetchContacts(query, nextPage, sort, dir, { force: true });
    window.setTimeout(() => {
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    }, 0);
  }, [dir, fetchContacts, query, rowsPerPage, sort, syncUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      const nextPage = 1;
      fetchContacts(query, nextPage, sort, dir, { force: true });
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [dir, fetchContacts, query, rowsPerPage, sort, syncUrl]);

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
        query={query}
        sort={sort}
        dir={dir}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onOpen={handleOpen}
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
      {openContact && (
        <div
          className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
            closing ? "opacity-0" : "opacity-100"
          }`}
          onClick={handleClose}
        >
          <div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
            <div
              className={`w-full max-w-xl bg-white shadow-lg transition-all duration-200 ${
                closing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-[var(--pp-border)] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          openContact.readAt ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      <span>{openContact.readAt ? "Read" : "Unread"}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
                      {openContact.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--pp-muted)]">{openContact.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
                    aria-label="Close message"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M6 6l12 12" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M18 6l-12 12" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-[var(--pp-ink)]">{openContact.message}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                  {new Date(openContact.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/40 px-6 py-4">
                {openContact.readAt ? (
                  <button
                    type="button"
                    className="btn-outline admin-btn admin-btn-size"
                    onClick={() => handleMarkUnread(openContact.id)}
                  >
                    Mark unread
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-outline admin-btn admin-btn-size"
                    onClick={() => handleMarkRead(openContact.id)}
                  >
                    Mark read
                  </button>
                )}
                <button type="button" className="btn-outline admin-btn admin-btn-size" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
