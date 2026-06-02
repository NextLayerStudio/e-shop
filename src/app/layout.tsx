import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} – 3D výtlačky na mieru`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: `${BRAND_NAME} – kvalitné 3D výtlačky, doplnky a tlač na mieru. Objednávajte priamo z e-shopu.`,
  icons: {
    icon: [{ url: "/LOGO.webp", type: "image/webp" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {children}
      </body>
    </html>
  );
}
