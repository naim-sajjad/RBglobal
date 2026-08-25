import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import '@/app/globals.css'

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'R&B Services Plus Inc. | Connecting Talent With Opportunity',
  description:
    'A full service recruitment company specializing in industrial, warehousing and trucking positions. 100% Canadian owned and operated, servicing Toronto and the GTA.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/rb-logo.avif', type: 'image/avif' }],
    shortcut: '/rb-logo.avif',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
