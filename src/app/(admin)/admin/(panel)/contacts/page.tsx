import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import AdminContactsClient from "@/components/admin/admin-contacts-client";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Contacts" },
};

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? "createdAt").trim();
  const dir = (params.dir ?? "desc").trim();
  const allowedSorts = new Set(["createdAt", "name", "email"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "createdAt") as
    | "createdAt"
    | "name"
    | "email";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { message: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const orderBy: Prisma.ContactOrderByWithRelationInput =
    sortKey === "name"
      ? { name: dirKey }
      : sortKey === "email"
      ? { email: dirKey }
      : { createdAt: dirKey };

  let contacts: Array<Awaited<ReturnType<typeof prisma.contact.findMany>>[number]> = [];
  let total = 0;
  let dbUnavailable = false;

  try {
    const [contactsResult, totalResult] = await Promise.all([
      prisma.contact.findMany({
        orderBy,
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.contact.count({ where }),
    ]);
    contacts = contactsResult;
    total = totalResult;
  } catch (error) {
    console.error("Admin contacts DB error:", error);
    dbUnavailable = true;
  }

  const serialized = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    message: contact.message,
    createdAt: contact.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-4">
      {dbUnavailable && <OfflineBanner />}
      <AdminContactsClient
        initialContacts={serialized}
        initialTotal={total}
        initialPage={page}
        pageSize={pageSize}
        initialQuery={query}
        initialSort={[sortKey]}
        initialDir={[dirKey]}
      />
    </div>
  );
}
