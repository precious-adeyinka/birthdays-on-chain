import type { Metadata } from "next";
import { poppins } from "./fonts";
import "./globals.css";

// components
import Navbar from "@/app/ui/navbar/Navbar"
import Provider from "./Provider"

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';

export const metadata: Metadata = {
  title: {
    template: "%s | Birthday On-Chain",
    default: "Birthday On-Chain"
  },
  description: "Celebrate your birthday on the blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${poppins.className} antialiased h-auto w-full overflow-hidden overflow-y-auto`}
      >
        <Provider>
          <Navbar />
          <MantineProvider>{children}</MantineProvider>
        </Provider>
      </body>
    </html>
  );
}
