import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Spot',
  description: 'Your field journal for hidden places',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
