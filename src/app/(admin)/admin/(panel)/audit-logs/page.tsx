import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import AdminAuditLogsClient from "@/components/admin/admin-audit-logs-client";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Audit Logs" },
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    dir?: string;
    action?: string;
    entity?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? "createdAt").trim();
  const dir = (params.dir ?? "desc").trim();
  const action = (params.action ?? "all").trim();
  const entity = (params.entity ?? "all").trim();

  const allowedSorts = new Set(["createdAt", "action", "entity", "actor"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "createdAt") as
    | "createdAt"
    | "action"
    | "entity"
    | "actor";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const where = {
    ...(action !== "all" ? { action } : {}),
    ...(entity !== "all" ? { entity } : {}),
    ...(query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" as const } },
            { entity: { contains: query, mode: "insensitive" as const } },
            { entityId: { contains: query, mode: "insensitive" as const } },
            { actor: { email: { contains: query, mode: "insensitive" as const } } },
            { ipAddress: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.AuditLogOrderByWithRelationInput =
    sortKey === "action"
      ? { action: dirKey }
      : sortKey === "entity"
      ? { entity: dirKey }
      : sortKey === "actor"
      ? { actor: { email: dirKey } }
      : { createdAt: dirKey };

  let logs: Array<
    Prisma.AuditLogGetPayload<{ include: { actor: true } }>
  > = [];
  let total = 0;
  let dbUnavailable = false;

  try {
    const [logsResult, totalResult] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: true },
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    logs = logsResult;
    total = totalResult;
  } catch (error) {
    console.error("Admin audit logs DB error:", error);
    dbUnavailable = true;
  }

  const serialized = logs.map((log) => ({
    id: log.id,
    actorEmail: log.actor.email,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId ?? null,
    metadata: log.metadata ?? null,
    ipAddress: log.ipAddress ?? null,
    userAgent: log.userAgent ?? null,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="grid gap-6">
      {dbUnavailable && <OfflineBanner />}
      <AdminAuditLogsClient
        initialLogs={serialized}
        initialTotal={total}
        initialPage={page}
        pageSize={pageSize}
        initialQuery={query}
        initialSort={[sortKey]}
        initialDir={[dirKey]}
        initialAction={action}
        initialEntity={entity}
      />
    </div>
  );
}
