import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import cloudinary from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

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

      const media = await prisma.media.create({
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format ?? null,
          width: result.width ?? null,
          height: result.height ?? null,
          bytes: result.bytes ?? null,
        },
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        mediaId: media.id,
      };
    })
  );

  await logAudit({
    actorId: session.user.id,
    action: "UPLOAD",
    entity: "MEDIA",
    metadata: { count: uploads.length, publicIds: uploads.map((item) => item.publicId) },
    request,
  });

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

  await prisma.media.deleteMany({
    where: { publicId: body.publicId },
  });

  await logAudit({
    actorId: session.user.id,
    action: "DELETE",
    entity: "MEDIA",
    entityId: body.publicId,
    request,
  });

  return NextResponse.json({ ok: true });
}
