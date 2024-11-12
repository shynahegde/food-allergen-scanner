import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  // Make environment variables available to the client
  if (typeof window !== 'undefined') {
    window.ENV = {
      NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY,
      NEXT_PUBLIC_EDAMAM_APP_ID: process.env.NEXT_PUBLIC_EDAMAM_APP_ID,
      NEXT_PUBLIC_EDAMAM_APP_KEY: process.env.NEXT_PUBLIC_EDAMAM_APP_KEY,
    };
  }

  return <Component {...pageProps} />
}
