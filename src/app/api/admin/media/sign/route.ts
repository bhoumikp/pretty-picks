import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = (await request.json().catch(() => null)) as
		| { crop?: boolean; webp?: boolean }
		| null;
	const crop = body?.crop ?? true;
	const webp = body?.webp ?? true;

	const timestamp = Math.floor(Date.now() / 1000);
	const folder = "pretty-picks";

	const transformationParts: string[] = [];
	if (crop) {
		transformationParts.push("c_fill", "ar_4:5", "g_auto");
	}
	if (webp) {
		transformationParts.push("f_webp");
	}
	const transformation = transformationParts.length ? transformationParts.join(",") : undefined;

	const signature = cloudinary.utils.api_sign_request(
		{
			timestamp,
			folder,
			...(transformation ? { transformation } : {}),
		},
		process.env.CLOUDINARY_API_SECRET ?? ""
	);

	return NextResponse.json({
		signature,
		timestamp,
		apiKey: process.env.CLOUDINARY_API_KEY,
		cloudName: process.env.CLOUDINARY_CLOUD_NAME,
		folder,
		transformation,
	});
}
