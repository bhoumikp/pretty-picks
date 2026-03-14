"use client";

import AdminTableShell from "@/components/admin/admin-table-shell";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

interface AdminContactsTableProps {
  contacts: ContactRow[];
  page: number;
  pageSize: number;
  total: number;
  sort: string[];
  dir: Array<"asc" | "desc">;
  onSort: (key: string) => void;
  onPageChange: (nextPage: number) => void;
  isLoading?: boolean;
  footerSlot?: React.ReactNode;
}

export default function AdminContactsTable({
  contacts,
  page,
  pageSize,
  total,
  sort,
  dir,
  onSort,
  onPageChange,
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
          </tr>
        </thead>
        <tbody>
          {contacts.length === 0 ? (
            <tr>
              <td className="admin-table-empty px-5 py-8 text-sm text-[var(--pp-muted)]" colSpan={4}>
                No contacts found.
              </td>
            </tr>
          ) : (
            contacts.map((contact) => (
              <tr key={contact.id} className="border-b border-[var(--pp-border)] last:border-b-0">
                <td className="admin-table-main px-5 py-4" data-label="Name">
                  <p className="font-semibold text-[var(--pp-ink)]">{contact.name}</p>
                  <p className="text-xs text-[var(--pp-muted)]">ID {contact.id.slice(0, 6)}</p>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Email">
                  {contact.email}
                </td>
                <td className="px-5 py-4" data-label="Message">
                  <p className="max-w-[320px] truncate text-[var(--pp-ink)]" title={contact.message}>
                    {contact.message}
                  </p>
                </td>
                <td className="px-5 py-4 text-[var(--pp-muted)]" data-label="Date">
                  {new Date(contact.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AdminTableShell>
  );
}
