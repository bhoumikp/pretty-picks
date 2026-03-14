"use client";

import { Trash2 } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";

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
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
}

export default function AdminOrdersTable({
  orders,
  page,
  pageSize,
  total,
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
          {orders.length === 0 ? (
            <tr>
              <td className="admin-table-empty px-5 py-8 text-sm text-[var(--pp-muted)]" colSpan={6}>
                No orders found.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="admin-table-main px-5 py-4" data-label="Product">
                  <div>
                    <p className="font-semibold text-[var(--pp-ink)]">{order.productName ?? "—"}</p>
                    <p className="text-xs text-[var(--pp-muted)]">ID {order.id.slice(0, 6)}</p>
                  </div>
                </td>
                <td className="px-5 py-4" data-label="Customer">
                  <p className="font-semibold text-[var(--pp-ink)]">{order.customerName}</p>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Phone">
                  {order.phone}
                </td>
                <td className="px-5 py-4" data-label="Status">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[var(--pp-beige)] text-[var(--pp-ink)]">
                    {order.status}
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
