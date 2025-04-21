import React from 'react';
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'mind map',
  description: 'Created for TDE',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.ico' 

  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="." />
      </head>
      <body>{children}</body>
    </html>
  )
}
