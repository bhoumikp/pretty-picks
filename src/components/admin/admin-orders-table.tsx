"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import { highlightText } from "@/lib/highlight";

interface OrderRow {
  id: string;
  productName?: string | null;
  customerName: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface AdminOrdersTableProps {
  orders: OrderRow[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
}

function AdminOrdersTable({
  orders,
  page,
  pageSize,
  total,
  query,
  sort,
  dir,
  onSort,
  onPageChange,
  onDelete,
  isLoading = false,
  footerSlot,
}: AdminOrdersTableProps) {
  const getDirFor = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? dir[index] ?? "desc" : undefined;
  };
  const getSortRank = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? index + 1 : null;
  };
  const showSkeleton = isLoading && orders.length === 0;
  const skeletonRows = Array.from({ length: Math.min(6, pageSize) }, (_, index) => index);

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
                onClick={() => onSort("product")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Product
                {getDirFor("product") && (
                  <span className="text-[10px]">
                    {getDirFor("product") === "asc" ? "↑" : "↓"}
                    {getSortRank("product")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("customerName")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Customer
                {getDirFor("customerName") && (
                  <span className="text-[10px]">
                    {getDirFor("customerName") === "asc" ? "↑" : "↓"}
                    {getSortRank("customerName")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">Phone</th>
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
                onClick={() => onSort("createdAt")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Date
                {getDirFor("createdAt") && (
                  <span className="text-[10px]">
                    {getDirFor("createdAt") === "asc" ? "↑" : "↓"}
                    {getSortRank("createdAt")}
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
                  <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                    <div className="h-2 w-16 rounded bg-[var(--pp-beige)]/50 animate-pulse" />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="h-3 w-24 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-3 w-20 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-5 w-20 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-3 w-20 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <div className="h-9 w-9 rounded-full bg-[var(--pp-beige)]/70 animate-pulse" />
                  </div>
                </td>
              </tr>
            ))
          ) : orders.length === 0 ? (
            <AdminEmptyState colSpan={6} message="No orders found." />
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="admin-table-main px-5 py-4" data-label="Product">
                  <div>
                    <p className="font-semibold text-[var(--pp-ink)]">
                      {order.productName ? highlightText(order.productName, query) : "—"}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4" data-label="Customer">
                  <p className="font-semibold text-[var(--pp-ink)]">
                    {highlightText(order.customerName, query)}
                  </p>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Phone">
                  {highlightText(order.phone, query)}
                </td>
                <td className="px-5 py-4" data-label="Status">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[var(--pp-beige)] text-[var(--pp-ink)]">
                    {highlightText(order.status, query)}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Date">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="admin-table-actions px-5 py-4" data-label="Actions">
                  <div className="flex justify-end">
                    <button
                      onClick={() => onDelete(order.id)}
                      className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
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

export default memo(AdminOrdersTable);
