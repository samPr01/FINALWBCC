export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Coincents SEO tags */}
        <meta name="title" content="Coincents - Crypto Trading Platform" />
        <meta
          name="description"
          content="Trade crypto with precision, analytics, and insights powered by Coincents."
        />
        <meta property="og:title" content="Coincents" />
        <meta
          property="og:description"
          content="Smart crypto trading and wallet management."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" />
        <meta property="og:image" content="/coincents-banner.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <UserProvider>{children}</UserProvider>
        </Providers>
      </body>
    </html>
  );
}
