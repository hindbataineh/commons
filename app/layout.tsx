import type { Metadata } from "next";
import { Readex_Pro, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const readexPro = Readex_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-readex",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Commons",
  description: "Community booking for the GCC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${readexPro.variable} ${cormorant.variable}`}>
      <body className="font-sans bg-linen text-carbon antialiased">
        {children}
      </body>
    </html>
  );
}
