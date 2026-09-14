import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requiredText = z.string().trim().min(1).max(8000);
const optionalText = z.union([z.string().trim().max(8000), z.array(z.string().trim().max(500)).max(20)]).optional();
const schema = z.object({
  website: z.string().max(0).optional(), country: requiredText, city: requiredText, setting: requiredText,
  clientName: requiredText, organisation: requiredText, position: requiredText, scale: requiredText,
  decision: requiredText, inaction: requiredText, duration: requiredText, currentExplanation: requiredText,
  cannotChange: requiredText, valueOfConversation: requiredText, authority: requiredText, participants: requiredText,
  travel: requiredText, paidAcknowledgement: z.literal("Yes"), nda: requiredText, contactName: requiredText,
  email: z.string().trim().email().max(320), phone: requiredText, contactMethod: requiredText,
}).catchall(optionalText);

const rate = new Map<string, { count: number; reset: number }>();
function limited(ip: string) {
  const now = Date.now(); const current = rate.get(ip);
  if (!current || current.reset < now) { rate.set(ip, { count: 1, reset: now + 60 * 60 * 1000 }); return false; }
  current.count += 1; return current.count > 5;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] || c));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Invalid request." }, { status: 415 });
  let raw: unknown; try { raw = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Please complete the required fields and check your contact details." }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY; const to = process.env.PRIVATE_BRIEF_TO_EMAIL;
  if (!apiKey || !to) return NextResponse.json({ error: "Private brief delivery is not connected yet. Please return once contact delivery has been activated." }, { status: 503 });
  const entries = Object.entries(parsed.data).filter(([k]) => k !== "website");
  const html = `<div style="font-family:Arial,sans-serif;color:#171513;max-width:760px"><h1>New private brief</h1>${entries.map(([k,v]) => `<section style="border-top:1px solid #ddd;padding:14px 0"><strong>${escapeHtml(k)}</strong><div style="white-space:pre-wrap;margin-top:6px">${escapeHtml(Array.isArray(v) ? v.join(", ") : v)}</div></section>`).join("")}</div>`;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.PRIVATE_BRIEF_FROM_EMAIL || "Mr & Mrs Pearce <onboarding@resend.dev>", to: [to], reply_to: parsed.data.email, subject: `Private brief — ${parsed.data.clientName} / ${parsed.data.organisation}`, html }) });
  if (!response.ok) return NextResponse.json({ error: "Your brief could not be delivered. Please try again later." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
