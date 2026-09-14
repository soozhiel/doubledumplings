import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const stripControls = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
const text = (max = 8000) => z.string().transform(stripControls).pipe(z.string().min(1).max(max));
const optional = (max = 8000) => z.string().transform(stripControls).pipe(z.string().max(max)).optional().or(z.literal(""));
const selection = z.preprocess((value) => Array.isArray(value) ? value : value ? [value] : [], z.array(text(200)).min(1).max(20));

const briefSchema = z.object({
  website: z.string().max(0).optional(),
  whatsHappening: text(), whatItMeans: text(), whatTried: optional(), whatHappened: text(), cannotChange: text(),
  nextMove: selection, nextMoveOther: optional(500), stakes: selection,
  figurePrivate: z.literal("Yes").optional(), amount: optional(100), currency: optional(10),
  noFixedDate: z.literal("Yes").optional(), realityDate: optional(30),
  involved: selection, agreement: text(200), authority: text(300),
  independenceAcknowledgement: z.literal("Yes"),
  clientName: text(300), position: text(300), organisation: text(500), companyWebsite: optional(1000),
  country: text(200), city: text(300), setting: text(300), participants: text(300), travel: text(300),
  paidAcknowledgement: z.literal("Yes"), nda: text(100),
  contactName: text(300), email: z.string().transform(stripControls).pipe(z.string().email().max(320)), phone: text(100), contactMethod: text(100),
  someoneElse: z.literal("Yes").optional(), coordinatorName: optional(300), coordinatorRole: optional(300), coordinatorEmail: optional(320), coordinatorPhone: optional(100),
  realityAcknowledgement: z.literal("Yes"),
}).strict().superRefine((data, ctx) => {
  if (data.nextMove.includes("Something else") && !data.nextMoveOther) ctx.addIssue({ code: "custom", path: ["nextMoveOther"], message: "Please describe the other move." });
  if (!data.noFixedDate && !data.realityDate) ctx.addIssue({ code: "custom", path: ["realityDate"], message: "Please provide a date or select no fixed date." });
  if (data.someoneElse && (!data.coordinatorName || !data.coordinatorRole || !data.coordinatorEmail || !data.coordinatorPhone)) ctx.addIssue({ code: "custom", path: ["someoneElse"], message: "Please complete the arrangements contact." });
  if (data.coordinatorEmail && !z.string().email().safeParse(data.coordinatorEmail).success) ctx.addIssue({ code: "custom", path: ["coordinatorEmail"], message: "Please enter a valid arrangements email." });
});

const localRate = new Map<string, { count: number; reset: number }>();
function locallyLimited(key: string) {
  const now = Date.now(); const current = localRate.get(key);
  if (!current || current.reset < now) { localRate.set(key, { count: 1, reset: now + 3_600_000 }); return false; }
  current.count += 1; return current.count > 5;
}

async function isLimited(key: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL; const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return locallyLimited(key);
  try {
    const response = await fetch(`${url}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify([["INCR", `private-brief:${key}`], ["EXPIRE", `private-brief:${key}`, 3600, "NX"]]), cache: "no-store" });
    if (!response.ok) return locallyLimited(key);
    const result = await response.json() as Array<{ result?: number }>;
    return Number(result[0]?.result || 0) > 5;
  } catch { return locallyLimited(key); }
}

async function storeBrief(id: string, data: z.infer<typeof briefSchema>) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, ""); const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false as const, missing: true as const };
  const { website: _honeypot, ...payload } = data;
  const response = await fetch(`${url}/rest/v1/private_briefs`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ id, name: data.clientName, organisation: data.organisation, country: data.country, contact_email: data.email, payload, status: "new" }), cache: "no-store" });
  return { ok: response.ok, missing: false as const };
}

async function sendMinimalNotification(id: string, data: z.infer<typeof briefSchema>) {
  const apiKey = process.env.RESEND_API_KEY; const to = process.env.PRIVATE_BRIEF_NOTIFICATION_EMAIL; const from = process.env.PRIVATE_BRIEF_FROM_EMAIL;
  if (!apiKey || !to || !from) return;
  const body = { from, to: [to], subject: "New private brief received", text: `A new private brief is stored securely.\n\nReference: ${id}\nName: ${data.clientName}\nOrganisation: ${data.organisation}\nCountry: ${data.country}\n\nThe full brief is not included in this email.` };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  if (!response.ok) console.error("Private brief stored, but minimal notification failed.");
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 150_000) return NextResponse.json({ error: "This brief is too large." }, { status: 413 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  const origin = request.headers.get("origin"); const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (await isLimited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  let raw: unknown; try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = briefSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Please complete the required fields and check your contact details." }, { status: 400 });
  const id = crypto.randomUUID(); const stored = await storeBrief(id, parsed.data);
  if (stored.missing) return NextResponse.json({ error: "Private brief delivery is not connected yet. No information has been accepted or stored." }, { status: 503 });
  if (!stored.ok) return NextResponse.json({ error: "Your brief could not be stored securely. Please try again later." }, { status: 502 });
  await sendMinimalNotification(id, parsed.data);
  return NextResponse.json({ ok: true, reference: id });
}
