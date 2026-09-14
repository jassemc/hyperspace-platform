import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  // #74 (S-10): the tab title is what appears in browser history and in
  // every screenshot sent to the owner; it read "Create Next App".
  title: {
    default: "Hyperspace Staff",
    template: "%s · Hyperspace",
  },
  description: "Hyperspace coworking back office",
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
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
