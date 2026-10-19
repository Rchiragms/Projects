import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chirag Nayaka M S | Data Science & Intelligent Systems",
  description:
    "Portfolio of Chirag Nayaka M S — Data Science, Artificial Intelligence, Digital Twins and Intelligent Systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}