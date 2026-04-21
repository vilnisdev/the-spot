import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { isThemePreference, THEME_COOKIE, type ThemePreference } from '@/lib/theme'
import { isUiSizePreference, UI_SIZE_COOKIE, type UiSizePreference } from '@/lib/uiSize'
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
  const theme: ThemePreference = isThemePreference(stored) ? stored : 'dark'
  const storedSize = cookieStore.get(UI_SIZE_COOKIE)?.value
  const uiSize: UiSizePreference = isUiSizePreference(storedSize) ? storedSize : 'medium'

  return (
    <html lang="en" data-theme={theme} data-size={uiSize} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
