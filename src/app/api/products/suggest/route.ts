import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Autocomplete hints for the shop search bar: active products whose name
 * matches the prefix or contains the query (prefix matches are sorted first).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ suggestions: [] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "query too long" }, { status: 400 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { startsWith: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 24,
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    });

    const qLower = q.toLowerCase();
    const sorted = [...products].sort((a, b) => {
      const aP = a.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      const bP = b.name.toLowerCase().startsWith(qLower) ? 0 : 1;
      if (aP !== bP) return aP - bP;
      return a.name.localeCompare(b.name, "sk");
    });

    return NextResponse.json({
      suggestions: sorted.slice(0, 8).map((p) => ({
        slug: p.slug,
        name: p.name,
      })),
    });
  } catch (e) {
    console.error("[api/products/suggest]", e);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
