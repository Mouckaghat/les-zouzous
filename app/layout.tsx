import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Les Zouzous - Universal Family Translator",
  description: "Your travel companion by Lobster Inc. under Jura Technology"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
