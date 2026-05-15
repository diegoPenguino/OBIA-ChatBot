import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OBIA — IOAI Bolivia 2026",
  description:
    "Asistente educativo de IA para la Competencia de Selección IOAI Bolivia 2026",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
