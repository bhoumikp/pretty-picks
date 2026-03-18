import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditParams = {
	actorId: string;
	action: string;
	entity: string;
	entityId?: string | null;
	metadata?: Prisma.InputJsonValue | null;
	request?: Request | null;
};

const getRequestMeta = (request?: Request | null) => {
	if (!request) return {};
	const forwarded = request.headers.get("x-forwarded-for");
	const ipAddress = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? undefined;
	const userAgent = request.headers.get("user-agent") ?? undefined;
	return { ipAddress, userAgent };
};

export async function logAudit({
	actorId,
	action,
	entity,
	entityId,
	metadata,
	request,
}: AuditParams) {
	try {
		const { ipAddress, userAgent } = getRequestMeta(request);
		await prisma.auditLog.create({
			data: {
				actorId,
				action,
				entity,
				entityId: entityId ?? null,
				metadata: metadata ?? undefined,
				ipAddress,
				userAgent,
			},
		});
	} catch (error) {
		console.error("Audit log failed:", error);
	}
}
