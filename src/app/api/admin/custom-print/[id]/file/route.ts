import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { toResponseBytes } from "@/lib/bytes";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await params;
  const r = await prisma.customPrintRequest.findUnique({
    where: { id },
    select: { fileData: true, fileMimeType: true, fileName: true },
  });
  if (!r || !r.fileData) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = toResponseBytes(r.fileData);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": r.fileMimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        r.fileName ?? "file"
      )}"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
