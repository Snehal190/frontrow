import type { Metadata, Viewport } from "next";
import { Big_Shoulders, JetBrains_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// No metric overrides exist for Big Shoulders; skip the generated fallback.
const display = Big_Shoulders({ variable: "--font-big-shoulders", subsets: ["latin"], weight: ["800", "900"], adjustFontFallback: false });
const text = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "FrontRow — You're already at the show",
  description: "FrontRow messages you the moment an indie artist you love announces a show in India.",
};

export const viewport: Viewport = {
  themeColor: "#07050b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable} antialiased`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
