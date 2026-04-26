import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik" });

export const metadata: Metadata = {
  title: "בילס — שליטה בהוצאות",
  description: "מעקב אחר הוצאות, חובות, סופר ותחזית לסוף החודש",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="min-h-dvh font-sans text-olive-900">{children}</body>
    </html>
  );
}
