import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";

import "react-toastify/dist/ReactToastify.css";

import ToastProvider from "app/_chat/components/toast-provider";

import { AppProvider } from "contexts/AppContext";

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "RAG AI Assistant",
    description: "Ask Questions About the Minneapolis Institute of Art Collection Using AI-Powered Search",
};

const RootLayout = ({
    children,
}: Readonly<{
    children: ReactNode;
}>) => (
    <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
            <AppProvider>{children}</AppProvider>
            <ToastProvider />
        </body>
    </html>
);

export default RootLayout;
