export const dynamic = "force-dynamic";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast"; // shadcn or react-hot-toast

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Courier Management System",
  description: "Multi-provider courier management dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Global Navbar (optional) */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
        >
          {children}
        </ThemeProvider>
        
        {/* Toast container */}
        <Toaster />
      </body>
    </html>
  );
}
