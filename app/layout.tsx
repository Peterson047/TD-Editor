import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TD Graph Editor",
  description: "Editor minimalista para diagramas TD com Mermaid",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
