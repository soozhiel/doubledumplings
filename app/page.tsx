"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

function Field({ label, name, type = "text", required = false, children }: { label: React.ReactNode; name: string; type?: string; required?: boolean; children?: React.ReactNode }) {
  return <label className="field"><span>{label}{required && <em> *</em>}</span>{children || <input name={name} type={type} required={required} />}</label>;
}

export default function Home() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [shareLabel, setShareLabel] = useState("SEND THIS PRIVATELY →");

  useEffect(() => {
    const draft = sessionStorage.getItem("double-dumplings-calling-card");
    if (!draft || !formRef.current) return;
    try {
      const values = JSON.parse(draft) as Record<string, string>;
      Object.entries(values).forEach(([name, value]) => {
        const field = formRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${CSS.escape(name)}"]`);
        if (field) field.value = value;
      });
    } catch {}
  }, []);

  function saveDraft() {
    if (!formRef.current) return;
    const values = Object.fromEntries([...new FormData(formRef.current)].filter(([name]) => name !== "website"));
    sessionStorage.setItem("double-dumplings-calling-card", JSON.stringify(values));
  }

  async function share() {
    const data = { title: document.title, text: "Double Dumplings — Independent Thinking for High-Stakes Decisions", url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        setShareLabel("LINK COPIED");
        setTimeout(() => setShareLabel("SEND THIS PRIVATELY →"), 2200);
      }
    } catch {}
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/private-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Your calling card could not be sent.");
      sessionStorage.removeItem("double-dumplings-calling-card");
      router.push("/received");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your calling card could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return <main>
    <section className="poster-stage" aria-label="Double Dumplings poster">
      <div className="poster-wrap">
        <Image src="/api/poster" alt="Double Dumplings — Pearcecision-backed decisions" width={1024} height={1536} priority unoptimized sizes="(max-width:740px) 100vw, 880px" />
        <button className="poster-hotspot" onClick={() => document.getElementById("calling-card")?.scrollIntoView({ behavior: "smooth" })} aria-label="Bring us the problem — go to calling card" />
      </div>
    </section>

    <section className="share-strip">
      <p>NOT YOUR DECISION?</p>
      <h2>Pass this privately to the person carrying it.</h2>
      <button onClick={share}>{shareLabel}</button>
    </section>

    <section className="editorial why">
      <p className="eyebrow">WHY DUMPLINGS?</p>
      <div className="editorial-grid">
        <div className="why-copy">
          <p>We do some of our best work in rooms that look like rest.</p>
          <p>Steam. Spa. A slow round. A chair while someone else does the hair.</p>
          <p>Body occupied. Noise dropped. Lid on. It’s personal.</p>
          <p>From outside, not much appears to be happening.</p>
          <p>That’s usually when something is.</p>
          <p>If you make your best calls on the course, in the chair, or in the steam, you know what we’re talking about.</p>
        </div>
      </div>
    </section>

    <section className="editorial what">
      <p className="eyebrow">WHAT HAPPENS?</p>
      <div className="what-copy">
        <p>You bring us the problem.</p>
        <p>We ask questions.</p>
        <p>Sometimes we arrive where your people already did.</p>
        <p>Sometimes something makes us stop and say:</p>
        <strong>Wait.</strong>
        <p>If there is something worth finding out, your experts can take it further.</p>
        <p>The decision remains yours.</p>
      </div>
    </section>

    <section className="pearcecision">
      <p className="eyebrow">PEARCECISION™</p>
      <p>A decision that’s had another pair of independent eyes on it before you move.</p>
    </section>

    <section className="brief-intro calling-card-intro" id="calling-card">
      <p className="eyebrow">CAELVERUM PRIVATE OFFICE</p>
      <h1>LEAVE YOUR <i>CALLING CARD</i></h1>
      <p>Request a private conversation.</p>
    </section>

    <form ref={formRef} className="calling-card-form" onSubmit={submit} onInput={saveDraft}>
      <section className="form-section calling-card-section">
        <Field label="Name" name="name" required />
        <Field label="Contact email" name="email" type="email" required />
        <Field label={<>Best city to meet <small className="label-note">(Munich, Sydney, New York, Tokyo, London etc)</small></>} name="bestCity" required />
      </section>

      <section className="form-section calling-card-section">
        <Field label="What can you share at this stage?" name="whatCanYouShare" required>
          <textarea name="whatCanYouShare" rows={7} required />
        </Field>
        <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </section>

      <div className="send">
        <p>Your draft is kept only in this browser tab until it is sent or closed.</p>
        <button type="submit" disabled={pending}>{pending ? "SENDING…" : "LEAVE CALLING CARD →"}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </form>

    <footer><span>DOUBLE DUMPLINGS</span><span>BACKED BY CAELVERUM</span><span>PEARCECISION-BACKED DECISIONS.</span></footer>
  </main>;
}
