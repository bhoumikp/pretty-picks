import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const messages = await prisma.contact.findMany({
		orderBy: { createdAt: "desc" },
	});
	return NextResponse.json(messages);
}

export async function POST(request: Request) {
	const body = await request.json();

	if (!body.name || !body.email || !body.message) {
		return NextResponse.json({ error: "Missing fields" }, { status: 400 });
	}

	// Security: Prevent oversized payloads
	if (body.name.length > 100 || body.email.length > 254 || body.message.length > 2000) {
		return NextResponse.json({ error: "Input too long" }, { status: 400 });
	}

	const contact = await prisma.contact.create({
		data: {
			name: body.name,
			email: body.email,
			message: body.message,
		},
	});

	return NextResponse.json(contact, { status: 201 });
}
