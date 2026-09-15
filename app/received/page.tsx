import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Calling Card Received — Double Dumplings",
  robots: { index: false, follow: false },
};

export default function ReceivedPage() {
  return <main className="received-page">
    <section className="received-card">
      <div className="received-tick" aria-hidden="true">✓</div>
      <h1>YOUR CALLING CARD HAS BEEN RECEIVED.</h1>
      <p>Caelverum Private Office will review it.</p>
      <p>If we’d like to continue the introduction, your calling card will be passed to Double Dumplings.</p>
      <p>Caelverum Private Office will be in touch to make the arrangements.</p>
      <Link className="received-home" href="/">RETURN HOME →</Link>
    </section>
  </main>;
}
