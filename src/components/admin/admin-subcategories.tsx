"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import ToastStack from "@/components/ui/toast-stack";
import AdminCategoriesTable from "@/components/admin/admin-categories-table";
import AdminSelect from "@/components/admin/admin-select";
import { validateRequired, validateUrlOptional } from "@/lib/validation";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ParentOption {
  id: string;
  name: string;
}

interface AdminSubcategoriesProps {
  initialSubcategories: CategoryRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialQuery: string;
  initialSort: string[];
  initialDir: Array<"asc" | "desc">;
  initialStatus: "all" | "active" | "inactive";
  parentOptions: ParentOption[];
}

const emptyForm = { id: "", name: "", image: "", parentId: "" };

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

export default function AdminSubcategories({
  initialSubcategories,
  initialTotal,
  initialPage,
  pageSize,
  initialQuery,
  initialSort,
  initialDir,
  initialStatus,
  parentOptions,
}: AdminSubcategoriesProps) {
  const storageKey = "admin-subcategories-state";
  const shouldPrefetch = process.env.NODE_ENV === "production";
  const categoryType = "sub";
  const [subcategories, setSubcategories] = useState(initialSubcategories);
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
      sort: initialSort[0] ?? "updatedAt",
      dir: (initialDir[0] ?? "desc") as "asc" | "desc",
      pageSize,
      status: initialStatus,
    }),
    [initialSort, initialDir, pageSize, initialStatus]
  );

  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; image?: string; parentId?: string }>(
    {}
  );
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
  >([]);

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
      const url = params ? `/admin/subcategories?${params}` : "/admin/subcategories";
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

  const fetchSubcategories = useCallback(
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
          setSubcategories(cached.items);
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
      const response = await fetch(
        `/api/admin/categories?type=${categoryType}${params ? `&${params}` : ""}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = (await response.json()) as { items: CategoryRow[]; total: number };
        cacheRef.current.set(key, data);
        if (!options?.prefetch) {
          setSubcategories(data.items);
          setTotal(data.total);
        }
      } else if (!options?.prefetch) {
        setSubcategories([]);
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
      fetchSubcategories(query, nextPage, sort, dir, status);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, rowsPerPage, sort, dir, status, fetchSubcategories, syncUrl]);

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
      window.setTimeout(() => {
        setQuery(nextQuery);
        setPage(nextPage);
        setSort(nextSort);
        setDir(nextDir);
        setStatus(nextStatus);
        setRowsPerPage(nextRows);
        fetchSubcategories(nextQuery, nextPage, nextSort, nextDir, nextStatus);
        syncUrl(nextQuery, nextPage, nextSort, nextDir, nextStatus, nextRows);
      }, 0);
    } catch {
      restoredRef.current = false;
      window.sessionStorage.removeItem(storageKey);
    }
  }, [dir, fetchSubcategories, page, query, rowsPerPage, sort, status, syncUrl]);

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
      fetchSubcategories(query, page + 1, sort, dir, status, { prefetch: true });
    }
    if (page > 1) {
      fetchSubcategories(query, page - 1, sort, dir, status, { prefetch: true });
    }
  }, [page, total, rowsPerPage, query, sort, dir, status, fetchSubcategories, loading, shouldPrefetch]);

  const handlePageChange = (nextPage: number) => {
    fetchSubcategories(query, nextPage, sort, dir, status);
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
    fetchSubcategories(query, nextPage, nextSort, nextDir, status);
    syncUrl(query, nextPage, nextSort, nextDir, status, rowsPerPage);
  };

  const handleRowsChange = (nextRows: number) => {
    const nextPage = 1;
    setRowsPerPage(nextRows);
    setPage(nextPage);
    fetchSubcategories(query, nextPage, sort, dir, status);
    syncUrl(query, nextPage, sort, dir, status, nextRows);
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (subcategory: CategoryRow) => {
    setForm({
      id: subcategory.id,
      name: subcategory.name,
      image: subcategory.image ?? "",
      parentId: subcategory.parentId ?? "",
    });
    setFieldErrors({});
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setFieldErrors({});
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const nameError = validateRequired(form.name, "Sub Category name");
    if (nameError) {
      setFieldErrors({ name: nameError.message });
      setSaving(false);
      return;
    }
    const parentError = validateRequired(form.parentId, "Parent category");
    if (parentError) {
      setFieldErrors((prev) => ({ ...prev, parentId: parentError.message }));
      setSaving(false);
      return;
    }
    const urlError = validateUrlOptional(form.image, "Image URL");
    if (urlError) {
      setFieldErrors((prev) => ({ ...prev, image: urlError.message }));
      setSaving(false);
      return;
    }

    const payload = { name: form.name, image: form.image, parentId: form.parentId };
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/categories/${form.id}` : "/api/categories";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Unable to save sub category. Please try again.");
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: "Unable to save sub category. Please try again." },
      ]);
      setSaving(false);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [
      ...prev,
      { id, type: "success", message: form.id ? "Sub Category updated." : "Sub Category created." },
    ]);

    const nextPage = form.id ? page : 1;
    setPage(nextPage);
    setModalOpen(false);
    setForm(emptyForm);
    await fetchSubcategories(query, nextPage, sort, dir, status, { force: true });
    syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sub category?")) return;
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (!response.ok) {
      setToasts((prev) => [
        ...prev,
        { id: toastId, type: "error", message: "Unable to delete sub category." },
      ]);
      return;
    }
    setToasts((prev) => [
      ...prev,
      { id: toastId, type: "success", message: "Sub Category deleted." },
    ]);
    const shouldGoBack = subcategories.length <= 1 && page > 1;
    const nextPage = shouldGoBack ? page - 1 : page;
    setPage(nextPage);
    await fetchSubcategories(query, nextPage, sort, dir, status, { force: true });
    syncUrl(query, nextPage, sort, dir, status, rowsPerPage);
  };

  const handleToggleActive = async (subcategory: CategoryRow) => {
    const nextActive = !subcategory.active;
    setSubcategories((prev) =>
      prev.map((item) =>
        item.id === subcategory.id ? { ...item, active: nextActive, updatedAt: new Date().toISOString() } : item
      )
    );

    const response = await fetch(`/api/categories/${subcategory.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: nextActive }),
    });
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (!response.ok) {
      setSubcategories((prev) =>
        prev.map((item) =>
          item.id === subcategory.id
            ? { ...item, active: subcategory.active, updatedAt: subcategory.updatedAt }
            : item
        )
      );
      setToasts((prev) => [
        ...prev,
        { id: toastId, type: "error", message: "Unable to update sub category status." },
      ]);
      return;
    }
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        type: "success",
        message: nextActive ? "Sub Category activated." : "Sub Category deactivated.",
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
    setSelectedIds(new Set(subcategories.map((subcategory) => subcategory.id)));
  };

  const bulkUpdateActive = async (nextActive: boolean) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const updatedAt = new Date().toISOString();
    setSubcategories((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, active: nextActive, updatedAt } : item))
    );
    setSelectedIds(new Set());
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/categories/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: nextActive }),
        })
      )
    );
  };

  const bulkArchive = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setSubcategories((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setTotal((prev) => Math.max(0, prev - ids.length));
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) => fetch(`/api/categories/${id}`, { method: "DELETE" })));
  };

  return (
    <>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Catalog</p>
            <h2 className="text-2xl font-[var(--font-heading)]">Sub Categories</h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex w-full items-center gap-2 sm:max-w-xs">
              <label htmlFor="admin-subcategories-search" className="sr-only">
                Search sub categories
              </label>
              <input
                id="admin-subcategories-search"
                value={query}
                onChange={(event) => {
                  userTypedRef.current = true;
                  setQuery(event.target.value);
                }}
                placeholder="Search sub categories"
                className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
              />
            </div>
            <div className="w-full sm:min-w-[170px] sm:w-auto">
              <AdminSelect
                value={status}
                onChange={(nextValue) => {
                  const nextStatus = nextValue as AdminSubcategoriesProps["initialStatus"];
                  setStatus(nextStatus);
                  const nextPage = 1;
                  setPage(nextPage);
                  fetchSubcategories(query, nextPage, sort, dir, nextStatus);
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
              <span className="admin-btn-label">Add Sub Category</span>
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
          categories={subcategories}
          page={page}
          pageSize={rowsPerPage}
          total={total}
          query={query}
          sort={sort}
          dir={dir}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          selectedIds={selectedIds}
          onToggleSelect={handleSelect}
          onToggleSelectAll={handleSelectAll}
          isLoading={loading}
          showParentColumn
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
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
            <div className="w-full max-w-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-[var(--font-heading)]">
                {form.id ? "Edit Sub Category" : "Add Sub Category"}
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
                <label className="admin-label">Parent category</label>
                <AdminSelect
                  value={form.parentId ?? ""}
                  onChange={(nextValue) => setForm({ ...form, parentId: String(nextValue) })}
                  options={[
                    { value: "", label: "Select parent category" },
                    ...parentOptions.map((parent) => ({ value: parent.id, label: parent.name })),
                  ]}
                  fullWidth
                  buttonClassName={`w-full admin-input ${
                    fieldErrors.parentId ? "border-red-300" : "border-[var(--pp-border)]"
                  }`}
                  header="Parent category"
                  ariaLabel="Parent category"
                />
                <span data-show={Boolean(fieldErrors.parentId)} className="field-error text-xs normal-case text-red-600">
                  {fieldErrors.parentId ?? ""}
                </span>
              </div>
              <div className="grid gap-2">
                <label htmlFor="admin-subcategory-name" className="admin-label">
                  Sub Category name
                </label>
                <input
                  id="admin-subcategory-name"
                  className={`admin-input ${
                    fieldErrors.name ? "border-red-300" : "border-[var(--pp-border)]"
                  }`}
                  placeholder="Sub Category name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  onBlur={(event) => {
                    if (!fieldErrors.name) return;
                    const result = validateRequired(event.target.value, "Sub Category name");
                    if (!result) {
                      setFieldErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                />
                <span data-show={Boolean(fieldErrors.name)} className="field-error text-xs normal-case text-red-600">
                  {fieldErrors.name ?? ""}
                </span>
              </div>
              <div className="grid gap-2">
                <label htmlFor="admin-subcategory-image" className="admin-label">
                  Image URL
                </label>
                <input
                  id="admin-subcategory-image"
                  className={`admin-input ${
                    fieldErrors.image ? "border-red-300" : "border-[var(--pp-border)]"
                  }`}
                  placeholder="Image URL"
                  value={form.image}
                  onChange={(event) => setForm({ ...form, image: event.target.value })}
                  onBlur={(event) => {
                    if (!fieldErrors.image) return;
                    const result = validateUrlOptional(event.target.value, "Image URL");
                    if (!result) {
                      setFieldErrors((prev) => ({ ...prev, image: undefined }));
                    }
                  }}
                />
                <span data-show={Boolean(fieldErrors.image)} className="field-error text-xs normal-case text-red-600">
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
    </>
  );
}
