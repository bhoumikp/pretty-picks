"use client";

import { memo } from "react";
import { Trash2, RefreshCw, Pencil, Eye } from "lucide-react";
import AdminTableShell from "@/components/admin/admin-table-shell";
import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminSelect from "@/components/admin/admin-select";
import { highlightText } from "@/lib/highlight";
import { formatCurrency } from "@/lib/utils";

export interface OrderItem {
	id: string;
	productId: string;
	productName: string;
	quantity: number;
	priceAtTime: number;
}

export interface OrderRow {
	id: string;
	orderNumber: string;
	customerName: string;
	phone: string;
	status: string;
	totalAmount: number;
	orderItems: OrderItem[];
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
	onView?: (order: OrderRow) => void;
	onEdit?: (order: OrderRow) => void;
	onUpdateStatus?: (id: string, nextStatus: string) => void;
	updatingStatusId?: string | null;
	selectedIds?: Set<string>;
	onSelect?: (id: string, selected: boolean) => void;
	onSelectAll?: (selected: boolean) => void;
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
	onView,
	onEdit,
	onUpdateStatus,
	updatingStatusId,
	selectedIds = new Set(),
	onSelect,
	onSelectAll,
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
	const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
	const someSelected = orders.some((o) => selectedIds.has(o.id)) && !allSelected;

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
						{onSelectAll && (
							<th className="px-5 py-4 w-12 text-center">
								<input
									type="checkbox"
									checked={allSelected}
									ref={(input) => {
										if (input) input.indeterminate = someSelected;
									}}
									onChange={(e) => onSelectAll(e.target.checked)}
									className="h-4 w-4 rounded border-[var(--pp-border)] text-[var(--pp-gold)] focus:ring-[var(--pp-gold)]"
								/>
							</th>
						)}
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("orderNumber")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Order ID
								{getDirFor("orderNumber") && (
									<span className="text-[10px]">
										{getDirFor("orderNumber") === "asc" ? "↑" : "↓"}
										{getSortRank("orderNumber")}
									</span>
								)}
							</button>
						</th>
						<th className="px-5 py-4">
							<button
								type="button"
								onClick={() => onSort("totalAmount")}
								className="inline-flex items-center gap-2 cursor-pointer"
							>
								Total
								{getDirFor("totalAmount") && (
									<span className="text-[10px]">
										{getDirFor("totalAmount") === "asc" ? "↑" : "↓"}
										{getSortRank("totalAmount")}
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
								{onSelectAll && (
									<td className="px-5 py-4">
										<div className="h-4 w-4 rounded bg-[var(--pp-beige)]/70 animate-pulse mx-auto" />
									</td>
								)}
								<td className="px-5 py-4">
									<div className="space-y-2">
										<div className="h-3 w-28 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
										<div className="h-2 w-16 rounded bg-[var(--pp-beige)]/50 animate-pulse" />
									</div>
								</td>
								<td className="px-5 py-4">
									<div className="h-3 w-16 rounded bg-[var(--pp-beige)]/70 animate-pulse" />
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
						<AdminEmptyState colSpan={onSelectAll ? 8 : 7} message="No orders found." />
					) : (
						orders.map((order) => (
							<tr 
								key={order.id} 
								className={`border-b border-[var(--pp-border)] last:border-b-0 transition-colors ${selectedIds.has(order.id) ? "bg-[var(--pp-gold)]/5" : "hover:bg-gray-50/50"}`}
							>
								{onSelect && (
									<td className="px-5 py-4 text-center">
										<input
											type="checkbox"
											checked={selectedIds.has(order.id)}
											onChange={(e) => onSelect(order.id, e.target.checked)}
											className="h-4 w-4 rounded border-[var(--pp-border)] text-[var(--pp-gold)] focus:ring-[var(--pp-gold)]"
										/>
									</td>
								)}
								<td className="admin-table-main px-5 py-4" data-label="Order ID">
									<div>
										<p className="font-semibold text-[var(--pp-ink)] font-mono text-xs">
											{highlightText(order.orderNumber || "Legacy", query)}
										</p>
									</div>
								</td>
								<td className="px-5 py-4" data-label="Total">
									<p className="font-semibold text-[var(--pp-ink)]">
										{formatCurrency(order.totalAmount)}
									</p>
								</td>
								<td className="px-5 py-4" data-label="Customer">
									<p className="font-semibold text-[var(--pp-ink)]">
										{highlightText(order.customerName, query)}
									</p>
								</td>
								<td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Phone">
									<div className="flex items-center gap-2">
										<span>{highlightText(order.phone, query)}</span>
										{order.phone && order.phone !== "-" && (
											<a
												href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366]/20 hover:scale-105"
												title="Chat on WhatsApp"
												aria-label="Chat on WhatsApp"
											>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
													<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
												</svg>
											</a>
										)}
									</div>
								</td>
								<td className="px-5 py-4" data-label="Status">
									{onUpdateStatus ? (
										<div className="flex w-full max-w-[140px] items-center gap-2">
											<AdminSelect
												value={order.status}
												onChange={(val) => onUpdateStatus(order.id, String(val))}
												disabled={updatingStatusId === order.id}
												options={[
													{ value: "WhatsApp Intent", label: "WhatsApp Intent" },
													{ value: "Pending", label: "Pending" },
													{ value: "Confirmed", label: "Confirmed" },
													{ value: "Shipped", label: "Shipped" },
													{ value: "Delivered", label: "Delivered" },
													{ value: "Cancelled", label: "Cancelled" },
												]}
												buttonClassName={`h-8 border-none px-2 py-1 text-xs font-semibold focus:ring-[var(--pp-gold)] ${
													updatingStatusId === order.id
														? "cursor-wait bg-[var(--pp-beige)] opacity-50 focus:ring-0"
														: "bg-[var(--pp-beige)]/50 hover:bg-[var(--pp-beige)] focus:ring-1"
												}`}
											/>
											{updatingStatusId === order.id && (
												<RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--pp-gold)]" />
											)}
										</div>
									) : (
										<span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[var(--pp-beige)] text-[var(--pp-ink)]">
											{highlightText(order.status, query)}
										</span>
									)}
								</td>
								<td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Date">
									{new Date(order.createdAt).toLocaleDateString("en-IN")}
								</td>
								<td className="admin-table-actions px-5 py-4" data-label="Actions">
									<div className="flex items-center justify-end gap-2">
										{onView && (
											<button
												onClick={() => onView(order)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)] hover:text-[var(--pp-gold)]"
												aria-label="View Details"
											>
												<Eye className="h-4 w-4" />
												<span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition-all group-hover:block group-hover:opacity-100">
													View
												</span>
											</button>
										)}
										{onEdit && (
											<button
												onClick={() => onEdit(order)}
												className="btn-round group relative flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--pp-border)] text-[var(--pp-ink)] transition hover:border-[var(--pp-gold)] hover:bg-[var(--pp-beige)] hover:text-[var(--pp-gold)]"
												aria-label="Edit Order"
											>
												<Pencil className="h-4 w-4" />
												<span className="pointer-events-none absolute -top-9 right-0 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition-all group-hover:block group-hover:opacity-100">
													Edit
												</span>
											</button>
										)}
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
