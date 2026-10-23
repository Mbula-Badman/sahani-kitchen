import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sahani Kitchen | Good Food. Kenyan Flavour.",
  description:
    "Discover Kenyan favourites and everyday meals at Sahani Kitchen. Explore our sample menu and get in touch about your next meal.",
  openGraph: {
    title: "Sahani Kitchen | Good Food. Kenyan Flavour.",
    description:
      "A warm welcome, generous plates and the flavours of home. Explore Sahani Kitchen.",
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sahani Kitchen | Good Food. Kenyan Flavour.",
    description: "Good food. Kenyan flavour. Every single day.",
  },
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
