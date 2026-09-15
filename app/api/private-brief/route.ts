import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const stripControls = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
const text = (max = 8000) => z.string().transform(stripControls).pipe(z.string().min(1).max(max));
const callingCardSchema = z.object({
  website: z.string().max(0).optional(),
  name: text(300),
  bestCity: text(500),
  whatCanYouShare: text(),
  email: z.string().transform(stripControls).pipe(z.string().email().max(320)),
}).strict();

const localRate = new Map<string, { count: number; reset: number }>();
function locallyLimited(key: string) {
  const now = Date.now();
  const current = localRate.get(key);
  if (!current || current.reset < now) {
    localRate.set(key, { count: 1, reset: now + 3_600_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

async function isLimited(key: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return locallyLimited(key);
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", `calling-card:${key}`], ["EXPIRE", `calling-card:${key}`, 3600, "NX"]]),
      cache: "no-store",
    });
    if (!response.ok) return locallyLimited(key);
    const result = await response.json() as Array<{ result?: number }>;
    return Number(result[0]?.result || 0) > 5;
  } catch {
    return locallyLimited(key);
  }
}

async function storeCallingCard(id: string, data: z.infer<typeof callingCardSchema>) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false as const, missing: true as const };
  const { website: _honeypot, ...payload } = data;
  const response = await fetch(`${url}/rest/v1/private_briefs`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ id, name: data.name, organisation: "", country: data.bestCity, contact_email: data.email, payload, status: "new" }),
    cache: "no-store",
  });
  return { ok: response.ok, missing: false as const };
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 50_000) return NextResponse.json({ error: "This calling card is too large." }, { status: 413 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (await isLimited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const parsed = callingCardSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Please complete the required fields and check your contact email." }, { status: 400 });

  const id = crypto.randomUUID();
  const stored = await storeCallingCard(id, parsed.data);
  if (stored.missing) return NextResponse.json({ error: "Calling-card delivery is not connected yet. No information has been accepted or stored." }, { status: 503 });
  if (!stored.ok) return NextResponse.json({ error: "Your calling card could not be stored securely. Please try again later." }, { status: 502 });
  return NextResponse.json({ ok: true, reference: id });
}
