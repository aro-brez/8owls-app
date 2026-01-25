import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eight Owls - Meet Your Mirror",
  description: "Voice-enabled consciousness companions that sound like you, learn from you, and help you think clearer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
