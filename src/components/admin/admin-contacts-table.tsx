"use client";

import { memo } from "react";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import { highlightText } from "@/lib/highlight";

interface ContactRow {
	id: string;
	name: string;
	email: string;
	message: string;
	readAt?: string | null;
	createdAt: string;
}

interface AdminContactsTableProps {
	contacts: ContactRow[];
	page: number;
	pageSize: number;
	total: number;
	query: string;
	sort: string[];
	dir: Array<"asc" | "desc">;
	onSort: (key: string) => void;
	onPageChange: (nextPage: number) => void;
	onOpen: (contact: ContactRow) => void;
	isLoading?: boolean;
	footerSlot?: React.ReactNode;
}

function AdminContactsTable({
	contacts,
	page,
	pageSize,
	total,
	query,
	sort,
	dir,
	onSort,
	onPageChange,
	onOpen,
	isLoading = false,
	footerSlot,
}: AdminContactsTableProps) {
	const getDirFor = (key: string) => {
		const index = sort.indexOf(key);
		return index >= 0 ? dir[index] ?? "desc" : undefined;
	};
	const getSortRank = (key: string) => {
		const index = sort.indexOf(key);
		return index >= 0 ? index + 1 : null;
	};
	const showSkeleton = isLoading && contacts.length === 0;
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
								onClick={() => onSort("name")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Name
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
								onClick={() => onSort("email")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Email
								{getDirFor("email") && (
									<span className="text-[10px]">
										{getDirFor("email") === "asc" ? "↑" : "↓"}
										{getSortRank("email")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">Message</th>
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
						<th className="px-5 py-4 text-right">View</th>
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
									<div className="h-3 w-32 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-48 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-20 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
								<td className="px-5 py-4">
									<div className="ml-auto h-7 w-16 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
								</td>
							</tr>
						))
					) : contacts.length === 0 ? (
						<AdminEmptyState colSpan={5} message="No contacts found." />
					) : (
						contacts.map((contact) => (
							<tr
								key={contact.id}
								className={`border-b border-[var(--pp-border)] last:border-b-0 ${
									contact.readAt ? "" : "bg-[var(--pp-beige)]/30"
								}`}
							>
								<td className="admin-table-main px-5 py-4" data-label="Name">
									<div className="flex items-center gap-2">
										{!contact.readAt && <span className="h-2 w-2 rounded-full bg-amber-500" />}
										<p className={`font-semibold ${contact.readAt ? "text-[var(--pp-ink)]" : "text-[var(--pp-ink)]"}`}>
											{highlightText(contact.name, query)}
										</p>
									</div>
								</td>
								<td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Email">
									{highlightText(contact.email, query)}
								</td>
								<td className="px-5 py-4" data-label="Message">
									<p className="max-w-[320px] truncate text-[var(--pp-ink)]" title={contact.message}>
										{highlightText(contact.message, query)}
									</p>
								</td>
								<td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Date">
									{new Date(contact.createdAt).toLocaleDateString("en-IN")}
								</td>
								<td className="px-5 py-4 text-right" data-label="View">
									<button
										type="button"
										className="btn-outline admin-btn admin-btn-size"
										onClick={() => onOpen(contact)}
									>
										View
									</button>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</AdminTableShell>
	);
}

export default memo(AdminContactsTable);
