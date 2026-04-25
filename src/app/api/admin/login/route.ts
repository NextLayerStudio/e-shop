import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkAdminCredentials,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné dáta." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vyplň prosím obe polia." },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;

  let ok = false;
  try {
    ok = checkAdminCredentials(username, password);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Chyba na strane servera.",
      },
      { status: 500 }
    );
  }

  if (!ok) {
    return NextResponse.json(
      { error: "Nesprávne meno alebo heslo." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(username);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
