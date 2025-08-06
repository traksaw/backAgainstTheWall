import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/useAuth" // Import AuthProvider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Back Against the Wall",
  description:
    "When financial pressure mounts, who do you become? Discover your financial archetype and watch this powerful short film.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider> {/* Wrapping children with AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
