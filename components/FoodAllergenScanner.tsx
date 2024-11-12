import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";

// Safely access environment variables with proper typing
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

  // Rest of your component code remains the same...
};

export default FoodAllergenScanner;
