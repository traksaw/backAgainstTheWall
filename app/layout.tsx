import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { ClientProviders } from "@/components/providers/ClientProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Back Against the Wall",
  description:
    "When financial pressure mounts, who do you become? Discover your financial archetype and watch this powerful short film.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // WAS-33: reading the nonce here (set by middleware.ts) is what actually
  // opts this render into using it for Next's own inline bootstrap scripts -
  // per Next's documented CSP pattern, this isn't just an example of how app
  // code could use the nonce, it's required for the framework's own scripts
  // to get nonced. Skipping this reproduces the pre-fix blank-page bug even
  // with the middleware changes in place.
  const nonce = (await headers()).get("x-nonce")

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true} data-csp-nonce={nonce ?? undefined}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
