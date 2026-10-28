import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HyperDX Next.js integration",
  description: "Every HyperDX signal from a Next.js app: traces, logs, metrics, errors, session replay.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
