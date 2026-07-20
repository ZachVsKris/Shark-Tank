import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shark Syndicate",
  description: "A multiplayer venture investing game"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
