import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Room Editor",
  description: "3D Room Editor with Three.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
