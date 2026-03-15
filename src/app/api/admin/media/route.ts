import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "24") || 24));
  const query = (searchParams.get("q") ?? "").trim();

  const where = {
    ...(query
      ? {
          OR: [
            { publicId: { contains: query, mode: "insensitive" as const } },
            { url: { contains: query, mode: "insensitive" as const } },
            { alt: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.media.count({ where: Object.keys(where).length ? where : undefined }),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    items?: Array<{
      url: string;
      publicId?: string;
      format?: string;
      width?: number;
      height?: number;
      bytes?: number;
          alt?: string;
    }>;
  } | null;

  const items = Array.isArray(body?.items) ? body?.items : [];
  if (!items.length) return NextResponse.json({ ok: true, count: 0 });

  const created = await Promise.all(
    items.map((item) =>
      prisma.media.create({
        data: {
          url: item.url,
          publicId: item.publicId ?? null,
          format: item.format ?? null,
          width: item.width ?? null,
          height: item.height ?? null,
          bytes: item.bytes ?? null,
          alt: item.alt ?? null,
        },
      })
    )
  );

  return NextResponse.json({
    ok: true,
    items: created.map((item) => ({
      id: item.id,
      url: item.url,
      publicId: item.publicId,
      format: item.format,
      width: item.width,
      height: item.height,
      bytes: item.bytes,
      alt: item.alt,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
