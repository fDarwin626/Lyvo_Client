import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext"; 
import { CreditProvider } from "./contexts/CreditContext";

export const metadata: Metadata = {
  title: "Lyvo",
  description: "Generate realistic AI voices for your content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider>
              <CreditProvider>
       <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
        {children}
        </GoogleOAuthProvider>
            </CreditProvider>

        </ThemeProvider>
      </body>
    </html>
  );
}