import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const banners = await prisma.heroBanner.findMany({
			where: { archivedAt: null },
			orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
		});

		return NextResponse.json(banners);
	} catch (error) {
		console.error("[BANNERS_GET]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const { eyebrow, title, subtitle, image, mobileImage, link, ctaLabel, priority, isActive } = body;

		if (!title || !image) {
			return new NextResponse("Missing required fields", { status: 400 });
		}

		const banner = await prisma.heroBanner.create({
			data: {
				eyebrow: eyebrow?.trim() || null,
				title,
				subtitle: subtitle?.trim() || null,
				image,
				mobileImage: mobileImage?.trim() || null,
				link: link?.trim() || null,
				ctaLabel: ctaLabel?.trim() || null,
				priority: parseInt(priority) || 0,
				isActive: isActive ?? true,
			},
		});

		const { logAudit } = await import("@/lib/audit");
		await logAudit({
			actorId: session.user.id,
			action: "CREATE",
			entity: "BANNER",
			entityId: banner.id,
			metadata: { title: banner.title },
			request: req,
		});

		return NextResponse.json(banner);
	} catch (error) {
		console.error("[BANNERS_POST]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
