import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nottto - Screenshot Annotation Tool",
  description: "Capture, annotate, and share screenshots with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
