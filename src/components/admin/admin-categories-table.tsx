"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminCategoriesTableProps {
  categories: CategoryRow[];
  page: number;
  pageSize: number;
  total: number;
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  onEdit: (category: CategoryRow) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
}

export default function AdminCategoriesTable({
  categories,
  page,
  pageSize,
  total,
  sort,
  dir,
  onSort,
  onPageChange,
  onEdit,
  onDelete,
  isLoading = false,
  footerSlot,
}: AdminCategoriesTableProps) {
  const getDirFor = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? dir[index] ?? "desc" : undefined;
  };
  const getSortRank = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <AdminTableShell
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      isLoading={isLoading}
      footerSlot={footerSlot}
    >
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--pp-border)] bg-white/70 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
          <tr>
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
            <th className="px-5 py-4">Image</th>
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
          {categories.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-sm text-[var(--pp-muted)]" colSpan={5}>
                No categories found.
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr key={category.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-[var(--pp-beige)] text-xs text-[var(--pp-muted)]">
                      {category.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--pp-ink)]">{category.name}</p>
                      <p className="text-xs text-[var(--pp-muted)]">ID {category.id.slice(0, 6)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]">/{category.slug}</td>
                <td className="px-5 py-4">
                  {category.image ? (
                    <div className="relative h-10 w-14 overflow-hidden rounded-lg bg-[var(--pp-beige)]">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--pp-muted)]">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]">
                  {new Date(category.updatedAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-5 py-4">
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
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
