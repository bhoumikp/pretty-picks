import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const { eyebrow, title, subtitle, image, mobileImage, link, ctaLabel, priority, isActive } = body;
		const { id } = await params;

		if (!id) {
			return new NextResponse("Banner ID is required", { status: 400 });
		}

		const banner = await prisma.heroBanner.update({
			where: { id },
			data: {
				...(title !== undefined ? { title } : {}),
				...(eyebrow !== undefined ? { eyebrow: eyebrow?.trim() || null } : {}),
				...(subtitle !== undefined ? { subtitle: subtitle?.trim() || null } : {}),
				...(image !== undefined ? { image } : {}),
				...(mobileImage !== undefined ? { mobileImage: mobileImage?.trim() || null } : {}),
				...(link !== undefined ? { link: link?.trim() || null } : {}),
				...(ctaLabel !== undefined ? { ctaLabel: ctaLabel?.trim() || null } : {}),
				...(priority !== undefined ? { priority: parseInt(priority) || 0 } : {}),
				...(isActive !== undefined ? { isActive } : {}),
			},
		});

		return NextResponse.json(banner);
	} catch (error) {
		console.error("[BANNER_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
		const { id } = await params;

		if (!id) {
			return new NextResponse("Banner ID is required", { status: 400 });
		}

		const banner = await prisma.heroBanner.delete({
			where: { id },
		});

		return NextResponse.json(banner);
	} catch (error) {
		console.error("[BANNER_DELETE]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
