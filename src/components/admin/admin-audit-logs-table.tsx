"use client";

import { memo } from "react";
import { Prisma } from "@prisma/client";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import { highlightText } from "@/lib/highlight";

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

interface AdminAuditLogsTableProps {
  logs: AuditLogRow[];
  page: number;
  pageSize: number;
  total: number;
  query: string;
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
}

const formatMeta = (metadata?: Prisma.JsonValue | null) => {
  if (!metadata) return "—";
  if (typeof metadata === "object" && metadata && !Array.isArray(metadata)) {
    const name = (metadata as Prisma.JsonObject).name;
    if (typeof name === "string") return name;
  }
  const text = JSON.stringify(metadata);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
};

function AdminAuditLogsTable({
  logs,
  page,
  pageSize,
  total,
  query,
  sort,
  dir,
  onSort,
  onPageChange,
  isLoading = false,
  footerSlot,
}: AdminAuditLogsTableProps) {
  const getDirFor = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? dir[index] ?? "desc" : undefined;
  };
  const getSortRank = (key: string) => {
    const index = sort.indexOf(key);
    return index >= 0 ? index + 1 : null;
  };
  const showSkeleton = isLoading && logs.length === 0;
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
                onClick={() => onSort("createdAt")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Time
                {getDirFor("createdAt") && (
                  <span className="text-[10px]">
                    {getDirFor("createdAt") === "asc" ? "↑" : "↓"}
                    {getSortRank("createdAt")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("actor")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Actor
                {getDirFor("actor") && (
                  <span className="text-[10px]">
                    {getDirFor("actor") === "asc" ? "↑" : "↓"}
                    {getSortRank("actor")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("action")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Action
                {getDirFor("action") && (
                  <span className="text-[10px]">
                    {getDirFor("action") === "asc" ? "↑" : "↓"}
                    {getSortRank("action")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">
              <button
                type="button"
                onClick={() => onSort("entity")}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                Entity
                {getDirFor("entity") && (
                  <span className="text-[10px]">
                    {getDirFor("entity") === "asc" ? "↑" : "↓"}
                    {getSortRank("entity")}
                  </span>
                )}
              </button>
            </th>
            <th className="px-5 py-4">Target</th>
            <th className="px-5 py-4">IP</th>
          </tr>
        </thead>
        <tbody>
          {showSkeleton ? (
            skeletonRows.map((row) => (
              <tr key={`skeleton-${row}`} className="border-b border-[var(--pp-border)] last:border-b-0">
                {Array.from({ length: 6 }).map((_, cell) => (
                  <td key={`${row}-${cell}`} className="px-5 py-4">
                    <div className="h-3 w-28 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : logs.length === 0 ? (
            <AdminEmptyState colSpan={6} message="No audit logs found." />
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Time">
                  {new Date(log.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="admin-table-main px-5 py-4" data-label="Actor">
                  <div>
                    <p className="font-semibold text-[var(--pp-ink)]">
                      {highlightText(log.actorEmail, query)}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4" data-label="Action">
                  <span className="inline-flex items-center rounded-full bg-[var(--pp-beige)] px-3 py-1 text-xs font-semibold text-[var(--pp-ink)]">
                    {highlightText(log.action, query)}
                  </span>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Entity">
                  {highlightText(log.entity, query)}
                </td>
                <td className="px-5 py-4" data-label="Target">
                  <p className="text-[var(--pp-ink)]">
                    {log.entityId ? highlightText(log.entityId, query) : "—"}
                  </p>
                  <p className="text-xs text-[var(--pp-muted)]">{formatMeta(log.metadata)}</p>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="IP">
                  {log.ipAddress ? highlightText(log.ipAddress, query) : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}

export default memo(AdminAuditLogsTable);
