import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth" // ✅ import the provider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Back Against the Wall - Financial Psychology Film",
  description:
    "When financial pressure mounts, who do you become? Discover your financial archetype and watch this powerful short film.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider> {/* ✅ Wrap children with AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
