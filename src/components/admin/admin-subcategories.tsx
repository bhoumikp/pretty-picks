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
  parentOptions: ParentOption[];
}

const emptyForm = { id: "", name: "", image: "", parentId: "" };

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

export default function AdminSubcategories({
  initialSubcategories,
  initialTotal,
  initialPage,
  pageSize,
  initialQuery,
  initialSort,
  initialDir,
  parentOptions,
}: AdminSubcategoriesProps) {
  const categoryType = "sub";
  const [subcategories, setSubcategories] = useState(initialSubcategories);
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
      sort: initialSort[0] ?? "updatedAt",
      dir: (initialDir[0] ?? "desc") as "asc" | "desc",
      pageSize,
    }),
    [initialSort, initialDir, pageSize]
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
      nextPageSize: number
    ) => {
      if (typeof window === "undefined") return;
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, nextPageSize, defaults);
      const url = params ? `/admin/subcategories?${params}` : "/admin/subcategories";
      window.history.replaceState(null, "", url);
    },
    [defaults]
  );

  const fetchSubcategories = useCallback(
    async (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">
    ) => {
      setLoading(true);
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, rowsPerPage, defaults);
      const response = await fetch(
        `/api/admin/categories?type=${categoryType}${params ? `&${params}` : ""}`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const data = (await response.json()) as { items: CategoryRow[]; total: number };
        setSubcategories(data.items);
        setTotal(data.total);
      } else {
        setSubcategories([]);
        setTotal(0);
      }
      setLoading(false);
    },
    [categoryType, defaults, rowsPerPage]
  );

  useEffect(() => {
    if (!userTypedRef.current) return;
    const handle = window.setTimeout(() => {
      const nextPage = 1;
      fetchSubcategories(query, nextPage, sort, dir);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, rowsPerPage, sort, dir, fetchSubcategories, syncUrl]);

  const handlePageChange = (nextPage: number) => {
    fetchSubcategories(query, nextPage, sort, dir);
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
    fetchSubcategories(query, nextPage, nextSort, nextDir);
    syncUrl(query, nextPage, nextSort, nextDir, rowsPerPage);
  };

  const handleRowsChange = (nextRows: number) => {
    const nextPage = 1;
    setRowsPerPage(nextRows);
    setPage(nextPage);
    fetchSubcategories(query, nextPage, sort, dir);
    syncUrl(query, nextPage, sort, dir, nextRows);
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
    await fetchSubcategories(query, nextPage, sort, dir);
    syncUrl(query, nextPage, sort, dir, rowsPerPage);
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
    await fetchSubcategories(query, nextPage, sort, dir);
    syncUrl(query, nextPage, sort, dir, rowsPerPage);
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
              <input
                value={query}
                onChange={(event) => {
                  userTypedRef.current = true;
                  setQuery(event.target.value);
                }}
                placeholder="Search sub categories"
                className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
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

        <AdminCategoriesTable
          categories={subcategories}
          page={page}
          pageSize={rowsPerPage}
          total={total}
          sort={sort}
          dir={dir}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
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
                buttonClassName="border border-[var(--pp-border)] bg-white px-3 py-1 text-xs"
              />
            </div>
          }
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
                <AdminSelect
                  value={form.parentId ?? ""}
                  onChange={(nextValue) => setForm({ ...form, parentId: String(nextValue) })}
                  options={[
                    { value: "", label: "Select parent category" },
                    ...parentOptions.map((parent) => ({ value: parent.id, label: parent.name })),
                  ]}
                  fullWidth
                  buttonClassName={`w-full border px-4 py-3 text-sm ${
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
                <input
                  className={`border px-4 py-3 text-sm ${
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
                <input
                  className={`border px-4 py-3 text-sm ${
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
                    {saving ? (form.id ? "Updating…" : "Saving…") : form.id ? "Update…" : "Save…"}
                  </span>
                </button>
              </div>
            </form>
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
