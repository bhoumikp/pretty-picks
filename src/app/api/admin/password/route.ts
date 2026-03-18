import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.email) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
	if (!body.currentPassword || !body.newPassword) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}
	if (body.newPassword.length < 8) {
		return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
	}

	const user = await prisma.user.findUnique({ where: { email: session.user.email } });
	if (!user) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	const isValid = await compare(body.currentPassword, user.password);
	if (!isValid) {
		return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
	}

	const nextHash = await hash(body.newPassword, 10);
	await prisma.user.update({
		where: { id: user.id },
		data: { password: nextHash },
	});

	await logAudit({
		actorId: user.id,
		action: "UPDATE",
		entity: "PASSWORD",
		entityId: user.id,
		request,
	});

	return NextResponse.json({ ok: true });
}
