import { Analytics } from '@vercel/analytics/next'
import { AppShell } from '@/components/app-shell'
import { AuthSessionProvider } from '@/components/auth-session-context'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SEDRE - Etude de faisabilite fonciere',
  description: 'Application d\'evaluation de faisabilite d\'operations foncieres avec analyse multicritere et bilan financier',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.jpg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon.jpg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.jpg',
        type: 'image/jpg',
      },
    ],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const requestHeaders = await headers()
  const userEmail = requestHeaders.get('x-user-email') ?? undefined
  const isAdmin = requestHeaders.get('x-user-is-super-admin') === '1'

  return (
    <html lang="fr" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthSessionProvider value={{ userEmail, isAdmin }}>
          <AppShell>{children}</AppShell>
        </AuthSessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
