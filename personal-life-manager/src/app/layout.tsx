import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createServerClient } from '@/lib/supabase/server'
import SupabaseProvider from '@/components/providers/supabase-provider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Personal Life Manager",
  description: "Comprehensive personal productivity and life management application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;

  try {
    const supabase = await createServerClient();
    const result = await supabase.auth.getSession();
    session = result.data.session;
  } catch (error) {
    console.error('Error getting session:', error);
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SupabaseProvider session={session}>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
