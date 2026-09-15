import type { Metadata } from "next";
import "./globals.css";

const title = "Double Dumplings — Independent Thinking for High-Stakes Decisions";
const description = "Bring us the problem. Independent perspective for owners, CEOs and decision makers before consequential moves. Private international engagements by request.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://doubledumplings.vercel.app"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", siteName: "Double Dumplings", images: [{ url: "/double-dumplings-poster.jpg", width: 1024, height: 1536, alt: "Double Dumplings — independent perspective, real questions, better decisions" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/double-dumplings-poster.jpg"] },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
