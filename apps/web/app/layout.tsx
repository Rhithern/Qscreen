import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { AnimatedToaster } from "@/components/ui/animated-toast";
import { getSiteContent } from "@/lib/content";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InterviewPro",
  description: "Connected interview platform for modern hiring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteContent;
  try {
    siteContent = getSiteContent();
  } catch (error) {
    console.error('Error loading site content in layout:', error);
    // Use fallback content if getSiteContent fails
    siteContent = {
      brand: { name: "InterviewPro", tagline: "Interview platform" },
      header: { menus: [] },
      hero: { headline: "", subheadline: "", primaryCta: { label: "", href: "" }, secondaryCta: { label: "", href: "" } },
      footer: { columns: [], social: [] }
    };
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <GlobalHeader siteContent={siteContent} />
          <main className="flex-1">
            {children}
          </main>
          <GlobalFooter siteContent={siteContent} />
        </div>
        <AnimatedToaster />
      </body>
    </html>
  );
}
