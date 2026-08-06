import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Admin Cumita",
  description: "Sistem Manajemen Pesanan Cumita",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

import { supabase } from "@/lib/supabase";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data } = await supabase.from('store_settings').select('theme_color, theme_gradient').eq('id', 'default').single();
  const themeColor = data?.theme_color;
  const themeGradient = data?.theme_gradient;

  return (
    <html lang="id" className={cn("h-full", poppins.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {(themeColor || themeGradient) && (
          <style dangerouslySetInnerHTML={{ __html: `
            :root { 
              ${themeColor ? `--primary: ${themeColor} !important;` : ''}
              ${themeGradient ? `--primary-gradient: ${themeGradient} !important;` : ''}
            }
            .dark { 
              ${themeColor ? `--primary: ${themeColor} !important;` : ''}
              ${themeGradient ? `--primary-gradient: ${themeGradient} !important;` : ''}
            }
          `}} />
        )}
      </head>
      <body className="h-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
