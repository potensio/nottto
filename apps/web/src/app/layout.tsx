import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "Annotate.QA - Visual Bug Reporting Tool",
  description:
    "The fastest way to report visual bugs. Draw rectangles, arrows, and text directly on your build, then push to Linear instantly.",
  keywords: [
    "bug reporting",
    "annotation",
    "QA tool",
    "Linear integration",
    "visual feedback",
    "chrome extension",
  ],
  openGraph: {
    title: "Annotate.QA - Visual Bug Reporting Tool",
    description:
      "The fastest way to report visual bugs. Draw rectangles, arrows, and text directly on your build, then push to Linear instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:wght@400&family=Gochi+Hand&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"
          defer
        />
      </head>
      <body className="min-h-screen flex flex-col relative text-neutral-900 selection:bg-red-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
