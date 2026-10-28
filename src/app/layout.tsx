import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tani Loa Lepu — Platform Tani Desa Loa Lepu: Kelola Lahan hingga Pasar Online",
  description:
    "Tani Loa Lepu — dikembangkan petani Desa Loa Lepu, Tenggarong Seberang, Kutai Kartanegara — membantu mengurus lahan, menyiapkan tanam, mengenali & merawat tanaman, sampai menjual hasil panen langsung ke masyarakat secara online.",
  keywords: [
    "pertanian", "petani", "kelola lahan", "tanaman", "panen", "pasar tani",
    "jualan hasil panen", "tani digital", "Loa Lepu", "Tenggarong Seberang",
    "Kutai Kartanegara", "Kalimantan Timur",
  ],
  authors: [{ name: "Petani Desa Loa Lepu" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Tani Loa Lepu — Dari Lahan ke Meja Makan",
    description:
      "Kelola lahan, siapkan tanam, rawat tanaman, dan jual hasil panen ke masyarakat dalam satu platform — dari petani Desa Loa Lepu, Kutai Kartanegara.",
    siteName: "Tani Loa Lepu",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2e7d4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
