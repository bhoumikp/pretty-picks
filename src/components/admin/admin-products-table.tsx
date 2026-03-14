"use client";

import Image from "next/image";
import Link from "next/link";
import { Power, PowerOff, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ProductImage } from "@/types/catalog";
import AdminTableShell from "@/components/admin/admin-table-shell";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName?: string | null;
  image?: ProductImage | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminProductsTableProps {
  products: ProductRow[];
  page: number;
  pageSize: number;
  total: number;
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  onToggleActive: (product: ProductRow) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
}

export default function AdminProductsTable({
  products,
  page,
  pageSize,
  total,
  sort,
  dir,
  onSort,
  onPageChange,
  onToggleActive,
  isLoading = false,
  footerSlot,
}: AdminProductsTableProps) {
  const getDirFor = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? dir[index] ?? "desc" : undefined;
  };
  const getSortRank = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? index + 1 : null;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
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
      <table className="admin-table w-full text-left text-sm">
        <thead className="border-b border-[var(--pp-border)] bg-white/70 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
          <tr>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("name")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Product
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
                onClick={() => onSort("category")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Category
                {getDirFor("category") && (
                  <span className="text-[10px]">
                    {getDirFor("category") === "asc" ? "↑" : "↓"}
                    {getSortRank("category")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("price")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Price
                {getDirFor("price") && (
                  <span className="text-[10px]">
                    {getDirFor("price") === "asc" ? "↑" : "↓"}
                    {getSortRank("price")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("stock")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Stock
                {getDirFor("stock") && (
                  <span className="text-[10px]">
                    {getDirFor("stock") === "asc" ? "↑" : "↓"}
                    {getSortRank("stock")}
                  </span>
                )}
              </button>
            </th>
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
          {products.length === 0 ? (
            <tr>
              <td className="admin-table-empty px-5 py-8 text-sm text-[var(--pp-muted)]" colSpan={7}>
                No products found.
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const isActive = product.stock > 0;
              return (
                <tr key={product.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                  <td className="admin-table-main px-5 py-4" data-label="Product">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 overflow-hidden rounded-lg bg-[var(--pp-beige)]">
                        {product.image?.url && (
                          <Image
                            src={product.image.url}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--pp-ink)]">{product.name}</p>
                        <p className="text-xs text-[var(--pp-muted)]">ID {product.id.slice(0, 6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Category">
                    {product.categoryName ?? "—"}
                  </td>
                  <td className="px-5 py-4 font-medium" data-label="Price">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-5 py-4" data-label="Stock">
                    {product.stock}
                  </td>
                  <td className="px-5 py-4" data-label="Status">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Updated">
                    {new Date(product.updatedAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="admin-table-actions px-5 py-4" data-label="Actions">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                          <span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
                            Edit
                          </span>
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                          <span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
                            Delete
                          </span>
                      </button>
                      <button
                        onClick={() => onToggleActive(product)}
                        className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)]"
                        aria-label={isActive ? "Deactivate" : "Activate"}
                      >
                        {isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        <span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
                          {isActive ? "Deactivate" : "Activate"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
