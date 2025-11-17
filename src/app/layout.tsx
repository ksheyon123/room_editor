import type { Metadata } from "next";
import "./globals.css";
import { ThreeProvider } from "@/contexts/ThreeContext";

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
      <body>
        <ThreeProvider>{children}</ThreeProvider>
      </body>
    </html>
  );
}
