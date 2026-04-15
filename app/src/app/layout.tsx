import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { isThemePreference, THEME_COOKIE, type ThemePreference } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Spot',
  description: 'Your field journal for hidden places',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const stored = cookieStore.get(THEME_COOKIE)?.value
  const theme: ThemePreference = isThemePreference(stored) ? stored : 'system'

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
