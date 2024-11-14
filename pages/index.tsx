import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Head from 'next/head'
import { Loader2 } from 'lucide-react'

// Dynamically import the scanner component with no SSR
const FoodAllergenScanner = dynamic(
  () => import('../components/FoodAllergenScanner'),
  { 
    ssr: false,
    loading: () => (
      <div className="max-w-md mx-auto p-4">
        <div className="min-h-[400px] rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Loading scanner...</p>
          </div>
        </div>
      </div>
    )
  }
)

export default function Home() {
  return (
    <>
      <Head>
        <title>Food Allergen Scanner</title>
        <meta name="description" content="Scan food products to detect allergens and ingredients" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        {/* PWA meta tags */}
        <meta name="application-name" content="Food Allergen Scanner" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Food Allergen Scanner" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FFFFFF" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Food Allergen Scanner
            </h1>
            <p className="text-gray-600">
              Scan food packaging to identify ingredients and potential allergens
            </p>
          </div>

          {/* Scanner Component */}
          <Suspense 
            fallback={
              <div className="max-w-md mx-auto p-4">
                <div className="min-h-[400px] rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-500">Loading scanner...</p>
                  </div>
                </div>
              </div>
            }
          >
            <FoodAllergenScanner />
          </Suspense>

          {/* Footer */}
          <footer className="mt-8 text-center text-sm text-gray-500">
            <p>
              Use your camera or upload images to scan food packaging.
              Supported on modern browsers and devices.
            </p>
            <p className="mt-2">
              For best results, ensure good lighting and clear text visibility.
            </p>
          </footer>
        </div>
      </main>
    </>
  )
}

// Make sure environment variables are available
export function getStaticProps() {
  return {
    props: {
      env: {
        NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY || '',
        NEXT_PUBLIC_EDAMAM_APP_ID: process.env.NEXT_PUBLIC_EDAMAM_APP_ID || '',
        NEXT_PUBLIC_EDAMAM_APP_KEY: process.env.NEXT_PUBLIC_EDAMAM_APP_KEY || '',
      }
    }
  }
}
