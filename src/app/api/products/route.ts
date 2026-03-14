import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { archivedAt: null },
    include: { category: true },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: slugify(body.name),
      price: Number(body.price),
      description: body.description,
      material: body.material,
      images: body.images ?? [],
      featured: Boolean(body.featured),
      stock: Number(body.stock ?? 0),
      categoryId: body.categoryId,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "CREATE",
    entity: "PRODUCT",
    entityId: product.id,
    metadata: { name: product.name, price: product.price, stock: product.stock },
    request,
  });

  return NextResponse.json(product, { status: 201 });
}
