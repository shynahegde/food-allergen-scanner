import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import { Suspense } from 'react'

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* PWA meta tags */}
        <meta name="application-name" content="Food Allergen Scanner" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Food Allergen Scanner" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Basic SEO */}
        <meta name="description" content="Scan food products to detect allergens and ingredients" />
        <meta name="keywords" content="food, allergens, scanner, ingredients, nutrition" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Food Allergen Scanner" />
        <meta property="og:description" content="Scan food products to detect allergens and ingredients" />
        <meta property="og:site_name" content="Food Allergen Scanner" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Food Allergen Scanner" />
        <meta name="twitter:description" content="Scan food products to detect allergens and ingredients" />
      </Head>

      <div className={`${inter.variable} font-sans`}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Component {...pageProps} />
        </Suspense>
      </div>
    </>
  );
}
