import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";

// Define types for environment variables
type EnvVarKey = 'NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY' | 'NEXT_PUBLIC_EDAMAM_APP_ID' | 'NEXT_PUBLIC_EDAMAM_APP_KEY';

// Define type for window.ENV
declare global {
  interface Window {
    ENV?: {
      [key in EnvVarKey]: string;
    };
  }
}

// Safely access environment variables with type safety
const getEnvVar = (key: EnvVarKey): string => {
  if (typeof window !== 'undefined') {
    return window.ENV?.[key] || '';
  }
  return '';
};

const FoodAllergenScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedIngredients, setDetectedIngredients] = useState<Array<{
    food: string;
    category: string;
    allergens: string[];
  }>>([]);
  const [allergenWarnings, setAllergenWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check if required environment variables are available
    const edamamAppId = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_ID');
    const edamamAppKey = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_KEY');
    const googleCloudApiKey = getEnvVar('NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY');

    setIsConfigured(
      Boolean(edamamAppId && edamamAppKey && googleCloudApiKey)
    );
  }, []);

  // Rest of your component code remains the same...

  return (
    // Your existing JSX remains the same...
  );
};

export default FoodAllergenScanner;
