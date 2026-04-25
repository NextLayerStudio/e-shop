import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id, imageId } = await params;
  const body = await req.json().catch(() => ({}));

  const target = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true },
  });
  if (!target || target.productId !== id) {
    return NextResponse.json({ error: "Obrázok neexistuje." }, { status: 404 });
  }

  if (body.isPrimary === true) {
    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: id },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.alt === "string") {
    await prisma.productImage.update({
      where: { id: imageId },
      data: { alt: body.alt },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Žiadne zmeny." }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id, imageId } = await params;

  const target = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true, isPrimary: true },
  });
  if (!target || target.productId !== id) {
    return NextResponse.json({ error: "Obrázok neexistuje." }, { status: 404 });
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  // Ensure at least one image stays marked primary if any remain.
  if (target.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
