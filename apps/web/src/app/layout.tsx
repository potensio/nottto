import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nottto - Screenshot Annotation Tool",
  description:
    "Capture, annotate, and share screenshots with one click. Arrows, shapes, text annotations, and instant sharing for faster bug reporting.",
  keywords: [
    "screenshot",
    "annotation",
    "bug report",
    "chrome extension",
    "screen capture",
    "feedback tool",
  ],
  openGraph: {
    title: "Nottto - Screenshot Annotation Tool",
    description:
      "Capture, annotate, and share screenshots with one click. Arrows, shapes, text annotations, and instant sharing for faster bug reporting.",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:wght@400&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"
          defer
        />
      </head>
      <body className="min-h-screen flex flex-col relative overflow-hidden text-neutral-900 selection:bg-orange-100">
        {children}
      </body>
    </html>
  );
}
