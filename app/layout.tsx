import type { Metadata } from "next";
import "./globals.css";

const title = "Mr & Mrs Pearce — Independent Thinking for High-Stakes Decisions";
const description = "Private independent problem diagnosis for owners, CEOs and decision makers facing consequential decisions. International engagements by request.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mr-mrs-pearce-caelverum.vercel.app"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", images: [{ url: "/api/poster", width: 1024, height: 1536, alt: "Mr & Mrs Pearce — Independent Thinking for High-Stakes Decisions" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/api/poster"] },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
