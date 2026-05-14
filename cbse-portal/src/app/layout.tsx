import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CBSE Results 2026 | Class XII Official Portal",
  description:
    "Official CBSE Class XII Board Examination Results 2026 for Amity International School, Sector 46, Gurgaon. Search by student name or roll number.",
  keywords: ["CBSE results 2026", "Class XII results", "board exam", "Amity Gurgaon", "CBSE Portal"],
  openGraph: {
    title: "CBSE Class XII Results 2026",
    description: "Official CBSE Class XII Board Examination Results 2026. View comprehensive performance analytics and student scorecards.",
    type: "website",
    locale: "en_IN",
    siteName: "CBSE Results Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "CBSE Class XII Results 2026",
    description: "Official CBSE Class XII Board Examination Results 2026. View comprehensive performance analytics and student scorecards.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
