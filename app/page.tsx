"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

const countries = `Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cabo Verde|Cambodia|Cameroon|Canada|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo, Democratic Republic of the|Congo, Republic of the|Costa Rica|Côte d’Ivoire|Croatia|Cuba|Cyprus|Czechia|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Holy See|Honduras|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Türkiye|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe|Åland Islands|American Samoa|Anguilla|Antarctica|Aruba|Bermuda|Bonaire, Sint Eustatius and Saba|Bouvet Island|British Indian Ocean Territory|British Virgin Islands|Cayman Islands|Christmas Island|Cocos (Keeling) Islands|Cook Islands|Curaçao|Falkland Islands|Faroe Islands|French Guiana|French Polynesia|French Southern Territories|Gibraltar|Greenland|Guadeloupe|Guam|Guernsey|Heard Island and McDonald Islands|Hong Kong|Isle of Man|Jersey|Macao|Martinique|Mayotte|Montserrat|New Caledonia|Niue|Norfolk Island|Northern Mariana Islands|Pitcairn|Puerto Rico|Réunion|Saint Barthélemy|Saint Helena, Ascension and Tristan da Cunha|Saint Martin|Saint Pierre and Miquelon|Sint Maarten|South Georgia and the South Sandwich Islands|Svalbard and Jan Mayen|Tokelau|Turks and Caicos Islands|United States Minor Outlying Islands|United States Virgin Islands|Wallis and Futuna|Western Sahara`.split("|").sort();

const stakes = ["Money already spent","Proposed investment","Revenue at risk","Cost of delay","Enterprise / asset value","Reputation","People / organisational impact","Government / public impact","Other"];
const advisers = ["Internal leadership","Finance","Operations","Engineering / technical","Marketing / commercial","Legal / regulatory","Board","External consultants","Specialist advisers","Other"];

function Field({ label, name, type = "text", required = false, children, note, className = "" }: { label: string; name: string; type?: string; required?: boolean; children?: React.ReactNode; note?: string; className?: string }) {
  return <label className={`field ${className}`}><span>{label}{required && <em aria-hidden="true"> *</em>}</span>{children || <input name={name} type={type} required={required} />}{note && <small>{note}</small>}</label>;
}

function Choices({ name, options, multiple = false, required = false }: { name: string; options: string[]; multiple?: boolean; required?: boolean }) {
  return <div className="choices">{options.map((o, i) => <label className="choice" key={o}><input type={multiple ? "checkbox" : "radio"} name={name} value={o} required={required && i === 0} /><span>{o}</span></label>)}</div>;
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return <section className="form-section"><header><span>{n}</span><h2>{title}</h2></header>{children}</section>;
}

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [hasPendingDecision, setHasPendingDecision] = useState(false);
  const [privateValue, setPrivateValue] = useState(false);
  const [shareLabel, setShareLabel] = useState("SHARE THIS PAGE →");

  useEffect(() => {
    const draft = sessionStorage.getItem("pearce-private-brief");
    if (!draft || !formRef.current) return;
    try { const values = JSON.parse(draft); Object.entries(values).forEach(([k, v]) => { const nodes = formRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${CSS.escape(k)}"]`); nodes?.forEach(node => { if (node instanceof HTMLInputElement && (node.type === "checkbox" || node.type === "radio")) node.checked = Array.isArray(v) ? v.includes(node.value) : v === node.value; else if (typeof v === "string") node.value = v; }); }); } catch {}
  }, []);

  function saveDraft() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current); const out: Record<string, string | string[]> = {};
    data.forEach((v, k) => { if (k === "website") return; const val = String(v); out[k] = k in out ? ([] as string[]).concat(out[k] as string | string[], val) : val; });
    sessionStorage.setItem("pearce-private-brief", JSON.stringify(out));
  }

  async function share() {
    const data = { title: document.title, text: "Mr & Mrs Pearce — Independent Thinking for High-Stakes Decisions", url: location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); setShareLabel("LINK COPIED"); setTimeout(() => setShareLabel("SHARE THIS PAGE →"), 2200); } } catch {}
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError("");
    const fd = new FormData(e.currentTarget); const payload: Record<string, string | string[]> = {};
    fd.forEach((v, k) => { const val = String(v); payload[k] = k in payload ? ([] as string[]).concat(payload[k] as string | string[], val) : val; });
    try { const res = await fetch("/api/private-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await res.json(); if (!res.ok) throw new Error(body.error || "Your brief could not be sent."); sessionStorage.removeItem("pearce-private-brief"); setSent(true); } catch (err) { setError(err instanceof Error ? err.message : "Your brief could not be sent."); } finally { setPending(false); }
  }

  return <main>
    <section className="poster-stage" aria-label="Mr and Mrs Pearce poster">
      <div className="poster-wrap">
        <Image src="/api/poster" alt="Mr & Mrs Pearce — Independent Thinking for High-Stakes Decisions" width={1024} height={1536} priority unoptimized sizes="(max-width: 740px) 100vw, 880px" />
        <button className="poster-hotspot" onClick={() => document.getElementById("private-brief")?.scrollIntoView({ behavior: "smooth" })} aria-label="Bring us the problem — go to private brief form" />
      </div>
    </section>

    <section className="share-strip"><p>Know who should see this?</p><h2>Pass this privately to the decision maker carrying the problem.</h2><button onClick={share}>{shareLabel}</button></section>

    <section className="intro" id="private-brief"><p className="eyebrow">PRIVATE INTERNATIONAL ENGAGEMENT</p><h1>BRING US<br/><i>THE PROBLEM</i></h1><div><p>We work with owners, CEOs and decision makers facing consequential decisions.</p><p>If the situation is suited to how we work, Mr & Mrs Pearce can travel internationally for a private conversation with you and, where useful, the people closest to the problem.</p><p>You do not need to know the answer.</p><p>You do need to be close enough to the problem to tell us what is actually happening.</p></div></section>

    {sent ? <section className="confirmation" role="status"><p className="eyebrow">PRIVATE BRIEF</p><h1>Received.</h1><p>We review each brief personally.</p><p>If the problem appears suited to how we work, we will contact you to discuss the conversation, location and next steps.</p><small>Submission does not constitute acceptance of an engagement.</small></section> :
    <form ref={formRef} onSubmit={submit} onInput={saveDraft} onChange={(e) => { const t = e.target; if (t instanceof HTMLInputElement && t.name === "pendingDecision") setHasPendingDecision(t.value === "Yes"); }}>
      <Section n="01" title="WHERE WOULD WE MEET?">
        <div className="grid two"><Field label="Country" name="country" required><><input name="country" list="countries" autoComplete="country-name" required /><datalist id="countries">{countries.map(c => <option key={c} value={c} />)}</datalist></></Field><Field label="City" name="city" required /></div>
        <Field label="Preferred setting" name="setting"><Choices name="setting" required options={["Your office","Private hotel / meeting venue","Lunch or dinner","Other"]} /></Field>
      </Section>
      <Section n="02" title="WHO ARE WE SPEAKING WITH?">
        <div className="grid two"><Field label="Your name" name="clientName" required /><Field label="Company / organisation" name="organisation" required /><Field label="Company website" name="companyWebsite" type="url" /><Field label="Position" name="position"><select name="position" required defaultValue=""><option value="" disabled>Select position</option>{["Owner / Founder","CEO / Managing Director","Chair / Board","Minister / Government decision maker","Senior executive with decision authority","Family office / Principal","Other"].map(o=><option key={o}>{o}</option>)}</select></Field></div>
        <Field label="Approximate annual revenue / assets under responsibility" name="scale" note="This helps us understand the scale and consequence of the problem. It does not automatically determine suitability."><select name="scale" required defaultValue=""><option value="" disabled>Select range</option>{["Under USD $10M","$10M–$50M","$50M–$250M","$250M–$1B","$1B–$5B","$5B+","Government / public institution","Prefer to discuss privately"].map(o=><option key={o}>{o}</option>)}</select></Field>
      </Section>
      <Section n="03" title="WHAT ARE YOU ACTUALLY FACING?">
        <Field label="What are you currently being asked to decide, change, approve, stop or invest in?" name="decision" required><textarea name="decision" rows={5} required /></Field>
        <Field label="What happens if you do nothing?" name="inaction" required><textarea name="inaction" rows={4} required /></Field>
        <Field label="How long has this been unresolved?" name="duration"><Choices name="duration" required options={["Under 3 months","3–12 months","1–3 years","3–5 years","More than 5 years"]} /></Field>
        <Field label="What has already been tried?" name="tried"><textarea name="tried" rows={4} /></Field>
        <Field label="What happened?" name="outcome" note="The distinction between what was tried and what actually happened is important."><textarea name="outcome" rows={4} /></Field>
      </Section>
      <Section n="04" title="WHAT IS AT STAKE?">
        <Field label="What is financially or strategically tied to this problem?" name="stakes"><Choices name="stakes" multiple options={stakes} /></Field>
        <label className="choice private-toggle"><input type="checkbox" name="valuePrivate" value="Yes" onChange={e=>setPrivateValue(e.target.checked)} /><span>Prefer to discuss the value privately</span></label>
        {!privateValue && <div className="grid value-grid"><Field label="Amount" name="amount" type="number" /><Field label="Currency" name="currency"><select name="currency" defaultValue="USD"><option>USD</option><option>AUD</option><option>EUR</option><option>GBP</option><option>JPY</option><option>THB</option><option>SGD</option><option>HKD</option><option>CHF</option><option>CAD</option><option>NZD</option><option>AED</option><option>CNY</option><option>INR</option><option>Other</option></select></Field></div>}
        <Field label="Is another major decision or commitment currently pending?" name="pendingDecision"><Choices name="pendingDecision" required options={["Yes","No"]} /></Field>
        {hasPendingDecision && <div className="grid two conditional"><Field label="Approximate value of the pending decision" name="pendingValue" /><Field label="When does the decision need to be made?" name="decisionDate" type="date" /></div>}
      </Section>
      <Section n="05" title="WHAT ARE YOU CURRENTLY BEING TOLD?">
        <Field label="What are you currently being told the problem is?" name="currentExplanation" required><textarea name="currentExplanation" rows={4} required /></Field>
        <Field label="Who has already looked at it?" name="advisers"><Choices name="advisers" multiple options={advisers} /></Field>
        <Field label="Do they broadly agree?" name="agreement"><Choices name="agreement" required options={["Yes","No","Mostly","Several competing explanations","I’m no longer sure"]} /></Field>
        <Field label="What does everyone currently believe cannot be changed?" name="cannotChange" required className="key-question"><textarea name="cannotChange" rows={5} required /></Field>
      </Section>
      <Section n="06" title="WHAT WOULD MAKE THE CONVERSATION VALUABLE?">
        <Field label="What would make this conversation worth having for you?" name="valueOfConversation" required note="Clarity before a decision. An independent read of the problem. Pressure-testing what you have been told. Finding what may not have been considered. Understanding what recent results actually mean."><textarea name="valueOfConversation" rows={5} required /></Field>
      </Section>
      <Section n="07" title="CAN YOU MOVE THE PARTS?">
        <Field label="If the conversation reveals something worth investigating, are you in a position to direct the relevant people to investigate it?" name="authority"><Choices name="authority" required options={["Yes","I share that authority with others","I can materially influence the decision","No"]} /></Field>
      </Section>
      <Section n="08" title="WHO WOULD BE IN THE ROOM?">
        <Field label="Who would you like involved?" name="participants"><Choices name="participants" required options={["Just me","Me + one other decision maker","Small leadership group","Relevant experts may join part of the conversation","Not sure yet"]} /></Field>
        <p className="editorial-note">Private engagements are generally reserved with enough time for the problem to unfold properly.</p>
        <Field label="Would you like Mr & Mrs Pearce to travel to you?" name="travel"><Choices name="travel" required options={["Yes","Possibly","I would travel to them","We should discuss location"]} /></Field>
      </Section>
      <section className="commercial"><p className="eyebrow">INTERNATIONAL PRIVATE ENGAGEMENTS</p><h2>These are paid, private engagements.</h2><p>We travel selectively. Where international travel is required, agreed travel, accommodation and associated expenses are arranged separately from the engagement fee.</p><label className="choice required-check"><input type="checkbox" name="paidAcknowledgement" value="Yes" required /><span>I understand this is a paid private engagement and may involve international travel.</span></label></section>
      <section className="security"><p className="eyebrow">CONFIDENTIALITY / SECURITY</p><h2>Keep this first brief high-level.</h2><p>Please do not include trade secrets, customer data, legally privileged material or other highly sensitive information in this initial brief.</p><p>If an engagement is accepted, confidentiality arrangements and a secure channel for relevant material can be established before the conversation.</p><Field label="Would an NDA be required before further details are shared?" name="nda"><Choices name="nda" required options={["Yes","No","Possibly"]} /></Field></section>
      <Section n="09" title="CONTACT / ARRANGEMENTS">
        <div className="grid two"><Field label="Name" name="contactName" required /><Field label="Role / Executive Assistant / Office" name="contactRole" /><Field label="Email" name="email" type="email" required /><Field label="Phone / WhatsApp" name="phone" type="tel" required /></div>
        <Field label="Preferred contact method" name="contactMethod"><Choices name="contactMethod" required options={["Email","Phone","WhatsApp"]} /></Field>
        <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </Section>
      <div className="send"><p>Your draft is kept only in this browser tab until it is sent or closed.</p><button type="submit" disabled={pending}>{pending ? "SENDING…" : "SEND PRIVATE BRIEF →"}</button>{error && <p className="error" role="alert">{error}</p>}</div>
    </form>}
    <footer><span>CAELVERUM</span><span>MR & MRS PEARCE</span><span>PRIVATE · INTERNATIONAL · SELECTIVE</span></footer>
  </main>;
}
