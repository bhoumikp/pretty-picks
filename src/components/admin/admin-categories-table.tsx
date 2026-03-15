"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import { highlightText } from "@/lib/highlight";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminCategoriesTableProps {
  categories: CategoryRow[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  onEdit: (category: CategoryRow) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (category: CategoryRow) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (checked: boolean) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
  showParentColumn?: boolean;
}

function AdminCategoriesTable({
  categories,
  page,
  pageSize,
  total,
  query,
  sort,
  dir,
  onSort,
  onPageChange,
  onEdit,
  onDelete,
  onToggleActive,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isLoading = false,
  footerSlot,
  showParentColumn = false,
}: AdminCategoriesTableProps) {
  const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null } | null>(null);
  const getDirFor = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? dir[index] ?? "desc" : undefined;
  };
  const getSortRank = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? index + 1 : null;
  };
  const columnCount = showParentColumn ? 8 : 7;
  const allSelected = categories.length > 0 && categories.every((category) => selectedIds.has(category.id));
  const showSkeleton = isLoading && categories.length === 0;
  const skeletonRows = Array.from({ length: Math.min(6, pageSize) }, (_, index) => index);

  return (
    <>
      <AdminTableShell
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      isLoading={isLoading}
      footerSlot={footerSlot}
    >
      <table className="admin-table w-full text-left text-sm">
        <thead className="border-b border-[var(--pp-border)] bg-white/70 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
          <tr>
            <th className="px-5 py-4">
              <input
                type="checkbox"
                aria-label="Select all categories"
                checked={allSelected}
                onChange={(event) => onToggleSelectAll(event.target.checked)}
              />
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("name")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Category
                {getDirFor("name") && (
                  <span className="text-[10px]">
                    {getDirFor("name") === "asc" ? "↑" : "↓"}
                    {getSortRank("name")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("slug")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Slug
                {getDirFor("slug") && (
                  <span className="text-[10px]">
                    {getDirFor("slug") === "asc" ? "↑" : "↓"}
                    {getSortRank("slug")}
                  </span>
                )}
              </button>
            </th>
            {showParentColumn && (
              <th className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => onSort("parent")}
                  className="inline-flex items-center gap-2 cursor-pointer"
                >
                  Parent
                  {getDirFor("parent") && (
                    <span className="text-[10px]">
                      {getDirFor("parent") === "asc" ? "↑" : "↓"}
                      {getSortRank("parent")}
                    </span>
                  )}
                </button>
              </th>
            )}
            <th className="px-5 py-4">Image</th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("status")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Status
                {getDirFor("status") && (
                  <span className="text-[10px]">
                    {getDirFor("status") === "asc" ? "↑" : "↓"}
                    {getSortRank("status")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("updatedAt")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Updated
                {getDirFor("updatedAt") && (
                  <span className="text-[10px]">
                    {getDirFor("updatedAt") === "asc" ? "↑" : "↓"}
                    {getSortRank("updatedAt")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {showSkeleton ? (
            skeletonRows.map((row) => (
              <tr key={`skeleton-${row}`} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="px-5 py-4">
                  <div className="h-4 w-4 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 w-28 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                      <div className="h-2 w-16 rounded bg-[var(--pp-beige)]/50 animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="h-3 w-24 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                {showParentColumn && (
                  <td className="px-5 py-4">
                    <div className="h-3 w-24 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="h-12 w-16 rounded-sm bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-5 w-20 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-3 w-20 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
                    <div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
                    <div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
                  </div>
                </td>
              </tr>
            ))
          ) : categories.length === 0 ? (
            <AdminEmptyState colSpan={columnCount} message="No categories found." />
          ) : (
            categories.map((category) => (
              <tr key={category.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="px-5 py-4" data-label="Select">
                  <input
                    type="checkbox"
                    aria-label={`Select ${category.name}`}
                    checked={selectedIds.has(category.id)}
                    onChange={(event) => onToggleSelect(category.id, event.target.checked)}
                  />
                </td>
                <td className="admin-table-main px-5 py-4" data-label="Category">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-[var(--pp-ink)]">
                        {highlightText(category.name, query)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Slug">
                  /{highlightText(category.slug, query)}
                </td>
                {showParentColumn && (
                  <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Parent">
                    {category.parentName ? highlightText(category.parentName, query) : "—"}
                  </td>
                )}
                <td className="px-5 py-4" data-label="Image">
                  {category.image ? (
                    <div className="relative h-12 w-16 overflow-hidden rounded-sm bg-[var(--pp-beige)] cursor-pointer">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={() => setPreviewItem({ url: category.image ?? "", title: category.name })}
                        aria-label={`Preview ${category.name}`}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--pp-muted)]">—</span>
                  )}
                </td>
                <td className="px-5 py-4" data-label="Status">
                  <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Updated">
                  {new Date(category.updatedAt).toLocaleDateString("en-IN")}
                </td>
                <td className="admin-table-actions px-5 py-4" data-label="Actions">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                        <span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
                          Edit
                        </span>
                    </button>
                    <button
                      onClick={() => onDelete(category.id)}
                      className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                        <span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
                          Delete
                        </span>
                    </button>
                    {onToggleActive && (
                      <button
                        onClick={() => onToggleActive(category)}
                        className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
                        aria-label={category.isActive ? "Deactivate" : "Activate"}
                      >
                        {category.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        <span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
                          {category.isActive ? "Deactivate" : "Activate"}
                        </span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </AdminTableShell>
      <AdminMediaViewer
        open={Boolean(previewItem)}
        item={previewItem ? { url: previewItem.url, title: previewItem.title ?? "Category image" } : null}
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}

export default memo(AdminCategoriesTable);
