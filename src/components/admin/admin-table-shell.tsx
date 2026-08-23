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
	hidePagination?: boolean;
}

const getPageNumbers = (current: number, total: number) => {
	if (isNaN(total) || total <= 0) return [];
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
	hidePagination = false,
}: AdminTableShellProps) {
	const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

	return (
		<div className="flex flex-col">
			<div className="soft-card relative p-0 overflow-visible" aria-busy={isLoading}>
				{isLoading && (
					<div className="absolute inset-0 z-10 overflow-hidden">
						<div className="absolute inset-0 bg-white/55" />
						<div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.6),transparent)] animate-[shimmer_1.2s_infinite]" />
					</div>
				)}
				<div
					className={`overflow-x-auto transition-opacity duration-200 ${
						isLoading ? "pointer-events-none opacity-70" : ""
					}`}
				>
					{children}
				</div>
			</div>
			{!hidePagination && (
				<div className="admin-sticky-footer admin-table-footer flex flex-wrap items-center gap-3 px-5 py-2 text-sm">
					<span className="text-[var(--pp-muted)]">
						Page {page} of {totalPages} · {total} items
					</span>
					<div className="flex items-center gap-4">{footerSlot}</div>
					<div className="ml-auto flex items-center gap-2">
						<button
							type="button"
							onClick={() => onPageChange(Math.max(1, page - 1))}
							className={`rounded border px-3 py-1 text-xs ${
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
										className={`rounded border px-3 py-1 text-xs ${
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
							className={`rounded border px-3 py-1 text-xs ${
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
			)}
		</div>
	);
}
