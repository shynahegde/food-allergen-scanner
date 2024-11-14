import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import Head from 'next/head'

// Initialize Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// Define types for environment variables
interface EnvVariables {
  NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: string;
  NEXT_PUBLIC_EDAMAM_APP_ID: string;
  NEXT_PUBLIC_EDAMAM_APP_KEY: string;
}

// Extend window interface to include ENV
declare global {
  interface Window {
    ENV?: EnvVariables;
  }
}

// Extend AppProps to include environment variables
interface CustomAppProps extends AppProps {
  pageProps: {
    env?: EnvVariables;
  }
}

export default function App({ Component, pageProps }: CustomAppProps) {
  // Make environment variables available to the client
  if (typeof window !== 'undefined' && pageProps.env) {
    window.ENV = {
      NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: pageProps.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY || '',
      NEXT_PUBLIC_EDAMAM_APP_ID: pageProps.env.NEXT_PUBLIC_EDAMAM_APP_ID || '',
      NEXT_PUBLIC_EDAMAM_APP_KEY: pageProps.env.NEXT_PUBLIC_EDAMAM_APP_KEY || '',
    };
  }

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
        {/* Error Boundary could be added here */}
        <Component {...pageProps} />
      </div>

      {/* Add any global modals or overlays here */}
    </>
  );
}

// Type guard for environment variables
function isValidEnv(env: any): env is EnvVariables {
  return (
    typeof env === 'object' &&
    typeof env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY === 'string' &&
    typeof env.NEXT_PUBLIC_EDAMAM_APP_ID === 'string' &&
    typeof env.NEXT_PUBLIC_EDAMAM_APP_KEY === 'string'
  );
}

// getInitialProps to handle environment variables
App.getInitialProps = async ({ Component, ctx }: any) => {
  let pageProps = {};

  // Get page's props
  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  // Add environment variables
  const env = {
    NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY,
    NEXT_PUBLIC_EDAMAM_APP_ID: process.env.NEXT_PUBLIC_EDAMAM_APP_ID,
    NEXT_PUBLIC_EDAMAM_APP_KEY: process.env.NEXT_PUBLIC_EDAMAM_APP_KEY,
  };

  // Validate environment variables
  if (!isValidEnv(env)) {
    console.warn('Missing or invalid environment variables');
  }

  return {
    pageProps: {
      ...pageProps,
      env
    }
  };
};
