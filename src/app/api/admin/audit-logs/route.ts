import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { searchParams } = new URL(request.url);
	const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
	const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "15") || 15));
	const query = (searchParams.get("q") ?? "").trim();
	const sort = (searchParams.get("sort") ?? "createdAt").trim();
	const dir = (searchParams.get("dir") ?? "desc").trim();
	const action = (searchParams.get("action") ?? "all").trim();
	const entity = (searchParams.get("entity") ?? "all").trim();

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

	const [logs, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			include: { actor: true },
			orderBy,
			take: pageSize,
			skip: (page - 1) * pageSize,
		}),
		prisma.auditLog.count({ where }),
	]);

	const items = logs.map((log) => ({
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

	return NextResponse.json({ items, total });
}
