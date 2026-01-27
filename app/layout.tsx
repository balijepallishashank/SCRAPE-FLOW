import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scrape Flow",
  description: "Automate your web scraping workflows with Scrape Flow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-neutral-50 dark:bg-neutral-950`}>
        <ClerkProvider
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-sm !shadow-none h-10",
            },
          }}
        >
          <AppProviders>
            {children}
            <Toaster richColors />
          </AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}