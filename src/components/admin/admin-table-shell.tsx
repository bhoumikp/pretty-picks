"use client";

import type { ReactNode } from "react";

interface AdminTableShellProps {
  children: ReactNode;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  isLoading?: boolean;
  footerSlot?: ReactNode;
}

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, total];
  if (current >= total - 2) return [1, total - 3, total - 2, total - 1, total];
  return [1, current - 1, current, current + 1, total];
};

export default function AdminTableShell({
  children,
  page,
  pageSize,
  total,
  onPageChange,
  isLoading = false,
  footerSlot,
}: AdminTableShellProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="soft-card relative p-0">
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-white/50" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.6),transparent)] animate-[shimmer_1.2s_infinite]" />
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-[var(--pp-border)] bg-white px-5 py-4 text-sm">
        <span className="text-[var(--pp-muted)]">
          Page {page} of {totalPages} · {total} items
        </span>
        <div className="flex items-center gap-4">{footerSlot}</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={`rounded-full border px-3 py-1 text-xs ${
              page <= 1
                ? "pointer-events-none border-[var(--pp-border)] text-[var(--pp-muted)]"
                : "border-[var(--pp-border)] text-[var(--pp-ink)]"
            }`}
            aria-disabled={page <= 1}
          >
            Prev
          </button>
          {getPageNumbers(page, totalPages).map((pageNumber, index, arr) => {
            const showEllipsis = index > 0 && pageNumber - arr[index - 1] > 1;
            return (
              <span key={`${pageNumber}-${index}`} className="flex items-center gap-2">
                {showEllipsis && <span className="text-xs text-[var(--pp-muted)]">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    pageNumber === page
                      ? "border-[var(--pp-gold)] bg-[var(--pp-gold)]/10 text-[var(--pp-ink)]"
                      : "border-[var(--pp-border)] text-[var(--pp-ink)]"
                  }`}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={`rounded-full border px-3 py-1 text-xs ${
              page >= totalPages
                ? "pointer-events-none border-[var(--pp-border)] text-[var(--pp-muted)]"
                : "border-[var(--pp-border)] text-[var(--pp-ink)]"
            }`}
            aria-disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
