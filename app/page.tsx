"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

const countries = `Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cabo Verde|Cambodia|Cameroon|Canada|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo, Democratic Republic of the|Congo, Republic of the|Costa Rica|Côte d’Ivoire|Croatia|Cuba|Cyprus|Czechia|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Holy See|Honduras|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Türkiye|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe|Åland Islands|American Samoa|Anguilla|Antarctica|Aruba|Bermuda|Bonaire, Sint Eustatius and Saba|Bouvet Island|British Indian Ocean Territory|British Virgin Islands|Cayman Islands|Christmas Island|Cocos (Keeling) Islands|Cook Islands|Curaçao|Falkland Islands|Faroe Islands|French Guiana|French Polynesia|French Southern Territories|Gibraltar|Greenland|Guadeloupe|Guam|Guernsey|Heard Island and McDonald Islands|Hong Kong|Isle of Man|Jersey|Macao|Martinique|Mayotte|Montserrat|New Caledonia|Niue|Norfolk Island|Northern Mariana Islands|Pitcairn|Puerto Rico|Réunion|Saint Barthélemy|Saint Helena, Ascension and Tristan da Cunha|Saint Martin|Saint Pierre and Miquelon|Sint Maarten|South Georgia and the South Sandwich Islands|Svalbard and Jan Mayen|Tokelau|Turks and Caicos Islands|United States Minor Outlying Islands|United States Virgin Islands|Wallis and Futuna|Western Sahara`.split("|").sort();

const actionOptions = ["Approve something","Invest / spend","Stop something","Change direction","Launch","Restructure","Wait","Sell / acquire","Make a public or institutional decision","Something else"];
const stakeOptions = ["Money already spent","Money about to be committed","Revenue","Time","People","Reputation","Enterprise / asset value","Public consequence","Government / institutional consequence","Something else"];
const involvedOptions = ["Internal leadership","Board","Finance","Operations","Engineering / technical","Product","Marketing / commercial","Legal / regulatory","External consultants","Specialist advisers","Government / public officials","Other"];

function Field({ label, name, type="text", required=false, children, note, className="" }: { label:string; name:string; type?:string; required?:boolean; children?:React.ReactNode; note?:string; className?:string }) {
  return <label className={`field ${className}`}><span>{label}{required && <em> *</em>}</span>{children || <input name={name} type={type} required={required}/>} {note && <small>{note}</small>}</label>;
}
function Choices({ name, options, multiple=false, required=false }: { name:string; options:string[]; multiple?:boolean; required?:boolean }) {
  return <div className="choices">{options.map((o,i)=><label className="choice" key={o}><input type={multiple?"checkbox":"radio"} name={name} value={o} required={required&&i===0}/><span>{o}</span></label>)}</div>;
}
function Section({ n, title, children, className="" }: { n?:string; title:string; children:React.ReactNode; className?:string }) {
  return <section className={`form-section ${className}`}><header>{n&&<span>{n}</span>}<h2>{title}</h2></header>{children}</section>;
}

export default function Home(){
  const formRef=useRef<HTMLFormElement>(null);
  const [pending,setPending]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState("");
  const [privateFigure,setPrivateFigure]=useState(false),[noDate,setNoDate]=useState(false),[otherAction,setOtherAction]=useState(false),[coordinator,setCoordinator]=useState(false);
  const [shareLabel,setShareLabel]=useState("SEND THIS PRIVATELY →");

  useEffect(()=>{const draft=sessionStorage.getItem("double-dumplings-private-brief");if(!draft||!formRef.current)return;try{const values=JSON.parse(draft);Object.entries(values).forEach(([k,v])=>{formRef.current?.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(`[name="${CSS.escape(k)}"]`).forEach(node=>{if(node instanceof HTMLInputElement&&(node.type==="checkbox"||node.type==="radio"))node.checked=Array.isArray(v)?v.includes(node.value):v===node.value;else if(typeof v==="string")node.value=v;});});setPrivateFigure(values.figurePrivate==="Yes");setNoDate(values.noFixedDate==="Yes");setOtherAction(Array.isArray(values.nextMove)&&values.nextMove.includes("Something else"));setCoordinator(values.someoneElse==="Yes");}catch{}},[]);
  function saveDraft(){if(!formRef.current)return;const data=new FormData(formRef.current),out:Record<string,string|string[]>={};data.forEach((v,k)=>{if(k==="website")return;const s=String(v);out[k]=k in out?[].concat(out[k] as never,s as never):s;});sessionStorage.setItem("double-dumplings-private-brief",JSON.stringify(out));}
  async function share(){const data={title:document.title,text:"Double Dumplings — Independent Thinking for High-Stakes Decisions",url:location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);setShareLabel("LINK COPIED");setTimeout(()=>setShareLabel("SEND THIS PRIVATELY →"),2200);}}catch{}}
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setPending(true);setError("");const fd=new FormData(e.currentTarget),payload:Record<string,string|string[]>={};fd.forEach((v,k)=>{const s=String(v);payload[k]=k in payload?[].concat(payload[k] as never,s as never):s;});try{const res=await fetch("/api/private-brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}),body=await res.json();if(!res.ok)throw new Error(body.error||"Your brief could not be sent.");sessionStorage.removeItem("double-dumplings-private-brief");setSent(true);window.scrollTo({top:document.getElementById("private-brief")?.offsetTop||0,behavior:"smooth"});}catch(err){setError(err instanceof Error?err.message:"Your brief could not be sent.");}finally{setPending(false);}}

  return <main>
    <section className="poster-stage" aria-label="Double Dumplings poster"><div className="poster-wrap"><Image src="/api/poster" alt="Double Dumplings — independent perspective, real questions, better decisions" width={1024} height={1536} priority unoptimized sizes="(max-width:740px) 100vw, 880px"/><button className="poster-hotspot" onClick={()=>document.getElementById("private-brief")?.scrollIntoView({behavior:"smooth"})} aria-label="Bring us the problem — go to private brief"/></div></section>
    <section className="share-strip"><p>NOT YOUR DECISION?</p><h2>Pass this privately to the person carrying it.</h2><button onClick={share}>{shareLabel}</button></section>

    <section className="editorial why"><p className="eyebrow">WHY DUMPLINGS?</p><div className="editorial-grid"><h1>Because<br/><i>we are.</i></h1><div><p>Dumplings is what we call each other.</p><p>We love a good life. Good food. Good hotels. Being looked after. We take enjoying life seriously.</p><p>And whenever possible, lifting the mountain with a finger instead of carrying it on our backs.</p><p>We take solving problems more seriously than being seen as the ones solving them.</p><p>We value our privacy. We protect yours.</p><p>We don’t need to be the most qualified people in your room. Your experts should be.</p><p>We don’t need to know more about your business than you do.</p><p>We are sharp at listening to everything you know without automatically inheriting everything you believe.</p><p>Then we look at it with you.</p><p>So, Double Dumplings.</p></div></div></section>
    <section className="editorial what"><p className="eyebrow">WHAT HAPPENS?</p><div className="what-copy"><p>You bring us the problem.</p><p>We ask questions.</p><p>Sometimes we arrive where your people already did.</p><p>Sometimes something makes us stop and say:</p><strong>Wait.</strong><p>If there is something worth finding out, your experts can take it further than we ever could.</p><p>The decision remains yours.</p></div></section>
    <section className="pearcecision"><p className="eyebrow">PEARCECISION™</p><p>A decision that’s had another pair of independent eyes on it before you move.</p></section>

    <section className="brief-intro" id="private-brief"><p className="eyebrow">CAELVERUM PRIVATE OFFICE</p><h1>BRING US<br/><i>THE PROBLEM</i></h1><p>Don’t send us the board-paper version.<br/>Tell us what is happening.</p></section>

    {sent?<section className="confirmation" role="status"><p className="eyebrow">CAELVERUM PRIVATE OFFICE</p><h1>BRIEF<br/>RECEIVED</h1><p>Your brief has been received by Caelverum Private Office.</p><p>Each engagement is reviewed for suitability before it is put forward.</p><p>If we believe Double Dumplings may be useful to the problem, you will be contacted regarding next steps, confidentiality, location and engagement arrangements.</p><small>Submission does not constitute acceptance of an engagement.</small></section>:
    <form ref={formRef} onSubmit={submit} onInput={saveDraft}>
      <section className="warning"><p className="eyebrow">BEFORE YOU TELL US</p><h2>Keep this first brief high-level.</h2><p>Do not send trade secrets, customer data, legally privileged information, passwords, confidential documents or anything you are not authorised to disclose.</p><p>If an engagement progresses, confidentiality arrangements and a secure channel can be established before sensitive material is shared.</p><strong>We don’t need the secrets yet. We need the shape of the problem.</strong></section>
      <Section n="01" title="THE PROBLEM">
        <Field label="What’s happening?" name="whatsHappening" required note="Tell us the unpolished version."><textarea name="whatsHappening" rows={7} required/></Field>
        <Field label="What are you being told it means?" name="whatItMeans" required><textarea name="whatItMeans" rows={5} required/></Field>
        <Field label="What have you already tried?" name="whatTried"><textarea name="whatTried" rows={5}/></Field>
        <Field label="What actually happened?" name="whatHappened" required note="Keep this separate from what was tried. The difference matters."><textarea name="whatHappened" rows={5} required/></Field>
        <Field label="What does everyone currently believe cannot be changed?" name="cannotChange" required className="key-question"><textarea name="cannotChange" rows={5} required/></Field>
        <Field label="What are you about to do?" name="nextMove"><div onChange={()=>setOtherAction(Boolean(formRef.current?.querySelector<HTMLInputElement>('input[name="nextMove"][value="Something else"]')?.checked))}><Choices name="nextMove" options={actionOptions} multiple/></div></Field>
        {otherAction&&<Field label="Something else" name="nextMoveOther" className="conditional"/>}
      </Section>
      <Section n="02" title="WHAT’S RIDING ON IT?">
        <Field label="What is at stake?" name="stakes"><Choices name="stakes" options={stakeOptions} multiple/></Field>
        <label className="choice standalone"><input type="checkbox" name="figurePrivate" value="Yes" onChange={e=>setPrivateFigure(e.target.checked)}/><span>Prefer to discuss the figure privately</span></label>
        {!privateFigure&&<div className="grid value-grid conditional"><Field label="Approximate financial exposure or decision value" name="amount" type="number"/><Field label="Currency" name="currency"><select name="currency" defaultValue="USD">{["USD","AUD","GBP","EUR","SGD","JPY","THB","AED","CHF","HKD","CAD","NZD","CNY","INR","Other"].map(o=><option key={o}>{o}</option>)}</select></Field></div>}
        <p className="microcopy">A number is useful where one exists. It is not required when the consequence cannot honestly be reduced to money.</p>
        <label className="choice standalone"><input type="checkbox" name="noFixedDate" value="Yes" onChange={e=>setNoDate(e.target.checked)}/><span>No fixed date yet</span></label>
        {!noDate&&<Field label="When does reality need an answer?" name="realityDate" type="date" className="date-field conditional"/>}
      </Section>
      <Section n="03" title="WHO HAS ALREADY LOOKED AT IT?">
        <Field label="Who has already been involved?" name="involved"><Choices name="involved" options={involvedOptions} multiple/></Field>
        <Field label="Do they broadly agree?" name="agreement"><Choices name="agreement" options={["Yes","No","Mostly","Several competing explanations","I’m no longer sure"]} required/></Field>
      </Section>
      <Section n="04" title="CAN YOU MOVE THE PARTS?">
        <Field label="If we notice something worth finding out, can you put the right people on it?" name="authority" note="Your own experts may be better positioned to prove or disprove what the conversation reveals."><Choices name="authority" options={["Yes","I share that authority with others","I can materially influence the decision","No"]} required/></Field>
      </Section>
      <section className="independence"><p className="eyebrow">WE MAY NOT AGREE WITH YOUR DIAGNOSIS.</p><h2>That’s partly why you’re bringing it to independent eyes.</h2><p>We may agree with you. We may agree with your experts. We may think the interesting question is somewhere else entirely.</p><p>We won’t manufacture disagreement to justify being there.</p><label className="choice required-check"><input type="checkbox" name="independenceAcknowledgement" value="Yes" required/><span>Good. That’s why I’m here.</span></label></section>
      <Section n="05" title="AND WHO ARE YOU?">
        <div className="grid two"><Field label="Name" name="clientName" required/><Field label="Role / position" name="position"><select name="position" required defaultValue=""><option value="" disabled>Select position</option>{["Owner / Founder","CEO / Managing Director","Chair / Board","Minister / Government decision maker","Senior executive with decision authority","Family office / Principal","Adviser acting for decision maker","Other"].map(o=><option key={o}>{o}</option>)}</select></Field><Field label="Company / organisation" name="organisation" required/><Field label="Website" name="companyWebsite" type="url"/></div>
      </Section>
      <Section n="06" title="IF WE COME TO YOU">
        <p className="section-lead">The dumplings travel.</p><p className="section-copy">For the right problem, we can come to you internationally for a private conversation with you and, where useful, the people closest to it.</p>
        <div className="grid two"><Field label="Country" name="country" required><><input name="country" list="countries" autoComplete="country-name" required/><datalist id="countries">{countries.map(c=><option key={c} value={c}/>)}</datalist></></Field><Field label="City" name="city" required/></div>
        <Field label="Preferred setting" name="setting"><Choices name="setting" options={["Your office","Private meeting room / hotel","Lunch","Other","Not sure yet"]} required/></Field>
        <Field label="Who would be in the room?" name="participants"><Choices name="participants" options={["Just me","Me + one other decision maker","Small leadership group","Relevant experts may join part of the conversation","Not sure yet"]} required/></Field>
        <p className="editorial-note">Private engagements are given enough time for the problem to unfold properly.</p>
        <Field label="Would you like Double Dumplings to travel to you?" name="travel"><Choices name="travel" options={["Yes","Possibly","I would travel to them","We should discuss location"]} required/></Field>
      </Section>
      <section className="commercial"><p className="eyebrow">INTERNATIONAL PRIVATE ENGAGEMENTS</p><h2>These are paid, private engagements.</h2><p>We travel selectively.</p><p>International engagements are coordinated through Caelverum Private Office. Agreed travel, accommodation and associated expenses are arranged separately from the engagement fee.</p><label className="choice required-check"><input type="checkbox" name="paidAcknowledgement" value="Yes" required/><span>I understand this is a paid private engagement and may involve international travel.</span></label></section>
      <Section n="07" title="CONFIDENTIALITY">
        <Field label="Would an NDA be required before further details are shared?" name="nda"><Choices name="nda" options={["Yes","No","Possibly"]} required/></Field>
      </Section>
      <Section n="08" title="ARRANGEMENTS">
        <p className="section-copy">Engagement enquiries, confidentiality arrangements and international logistics are coordinated through Caelverum Private Office.</p>
        <div className="grid two"><Field label="Who should we contact about this?" name="contactName" required/><Field label="Email" name="email" type="email" required/><Field label="Phone / WhatsApp" name="phone" type="tel" required/></div>
        <Field label="Preferred contact method" name="contactMethod"><Choices name="contactMethod" options={["Email","Phone","WhatsApp"]} required/></Field>
        <label className="choice standalone"><input type="checkbox" name="someoneElse" value="Yes" onChange={e=>setCoordinator(e.target.checked)}/><span>Someone else handles arrangements</span></label>
        {coordinator&&<div className="grid two conditional coordinator"><Field label="Name" name="coordinatorName" required/><Field label="Role" name="coordinatorRole" required/><Field label="Email" name="coordinatorEmail" type="email" required/><Field label="Phone" name="coordinatorPhone" type="tel" required/></div>}
        <label className="choice required-check final-vote"><input type="checkbox" name="realityAcknowledgement" value="Yes" required/><span>Reality gets the final vote.</span></label>
        <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      </Section>
      <div className="send"><p>Your draft is kept only in this browser tab until it is sent or closed.</p><button type="submit" disabled={pending}>{pending?"SENDING…":"SEND PRIVATE BRIEF →"}</button>{error&&<p className="error" role="alert">{error}</p>}</div>
    </form>}
    <footer><span>DOUBLE DUMPLINGS</span><span>BACKED BY CAELVERUM</span><span>IDEAS TRAVEL WELL.</span></footer>
  </main>;
}

