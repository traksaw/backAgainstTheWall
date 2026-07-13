import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { ClientProviders } from "@/components/providers/ClientProviders"

const inter = Inter({ subsets: ["latin"] })

const title = "Back Against the Wall"
const description =
  "When financial pressure mounts, who do you become? Discover your financial archetype and watch this powerful short film."
const posterPath = "/assets/desktop-movie-poster.png"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: posterPath,
        width: 1114,
        height: 626,
        alt: "Back Against the Wall movie poster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [posterPath],
  },
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
  //
  // Calling headers() also has a required side effect: it forces this layout
  // (and everything under it) into dynamic, per-request rendering. That's not
  // incidental - middleware.ts mints a brand-new nonce on every request, so
  // this render must happen fresh each time too, or the HTML and the CSP
  // header fall out of sync. If a later page under this layout adds
  // `export const dynamic = 'force-static'` or a `revalidate` value without
  // accounting for this, that page gets cached with a stale nonce baked into
  // its HTML that no longer matches the fresh nonce in the next request's CSP
  // header - every inline script on that page fails its nonce check, which is
  // the same blank-page failure mode this branch fixed.
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
