import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter(Boolean) as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUri = `data:${file.type};base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "pretty-picks",
        resource_type: "image",
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    })
  );

  return NextResponse.json({ uploads });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body?.publicId) {
    return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
  }

  await cloudinary.uploader.destroy(body.publicId, {
    resource_type: "image",
  });

  return NextResponse.json({ ok: true });
}
