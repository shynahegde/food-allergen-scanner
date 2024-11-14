import '@/styles/globals.css'
import type { AppProps } from 'next/app'

interface CustomAppProps extends AppProps {
  pageProps: {
    env?: {
      NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: string;
      NEXT_PUBLIC_EDAMAM_APP_ID: string;
      NEXT_PUBLIC_EDAMAM_APP_KEY: string;
    }
  }
}

export default function App({ Component, pageProps }: CustomAppProps) {
  // Make environment variables available to the client
  if (typeof window !== 'undefined' && pageProps.env) {
    window.ENV = pageProps.env;
  }

  return <Component {...pageProps} />
}
