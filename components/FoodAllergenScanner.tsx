import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";

type EnvVarKey = 'NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY' | 'NEXT_PUBLIC_EDAMAM_APP_ID' | 'NEXT_PUBLIC_EDAMAM_APP_KEY';

interface Ingredient {
  food: string;
  category: string;
  allergens: string[];
  confidence?: number;
}

const getEnvVar = (key: EnvVarKey): string => {
  return typeof window !== 'undefined' ? (window as any).ENV?.[key] || '' : '';
};

// Common allergens according to WHO
const COMMON_ALLERGENS = [
  'milk', 'egg', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans',
  'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
];

const FoodAllergenScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<Ingredient[]>([]);
  const [allergenWarnings, setAllergenWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg').split(',')[1];
  };

  const detectText = async (imageBase64: string): Promise<string> => {
    const apiKey = getEnvVar('NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY');
    if (!apiKey) throw new Error('Google Cloud API key not configured');

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION' }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.responses?.[0]?.textAnnotations?.[0]?.description) {
      throw new Error('No text detected in image');
    }

    return data.responses[0].textAnnotations[0].description;
  };

  const analyzeIngredients = async (text: string): Promise<Ingredient[]> => {
    const appId = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_ID');
    const appKey = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_KEY');
    
    if (!appId || !appKey) {
      throw new Error('Edamam API credentials not configured');
    }

    // Split text into potential ingredients
    const ingredients = text
      .toLowerCase()
      .split(/[,;\n]/)
      .map(i => i.trim())
      .filter(i => i.length > 2);

    const results: Ingredient[] = [];

    // Process each potential ingredient
    for (const ingredient of ingredients) {
      try {
        const response = await fetch(
          `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(ingredient)}`
        );

        if (!response.ok) {
          console.warn(`Failed to analyze ingredient: ${ingredient}`);
          continue;
        }

        const data = await response.json();
        if (data.hints && data.hints.length > 0) {
          const foodInfo = data.hints[0].food;
          
          // Detect allergens in the ingredient
          const detectedAllergens = COMMON_ALLERGENS.filter(allergen => 
            ingredient.includes(allergen) || 
            foodInfo.label.toLowerCase().includes(allergen)
          );

          results.push({
            food: foodInfo.label,
            category: foodInfo.categoryLabel || 'Unknown',
            allergens: detectedAllergens,
            confidence: data.hints[0].score
          });
        }
      } catch (err) {
        console.warn(`Error analyzing ingredient ${ingredient}:`, err);
      }
    }

    return results;
  };

  const processImage = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Capture image
      const imageBase64 = captureImage();
      if (!imageBase64) {
        throw new Error('Failed to capture image');
      }

      // Detect text in image
      setProgress(33);
      const detectedText = await detectText(imageBase64);
      setRawText(detectedText);
      
      // Analyze ingredients
      setProgress(66);
      const ingredients = await analyzeIngredients(detectedText);
      setDetectedIngredients(ingredients);

      // Extract allergen warnings
      const warnings = Array.from(new Set(
        ingredients.flatMap(item => item.allergens)
      ));
      setAllergenWarnings(warnings);

      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto p-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Food Allergen Scanner</span>
            {isScanning && (
              <button 
                onClick={stopCamera}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isScanning ? (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
                style={{ minHeight: '300px' }}
              />
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 
                         bg-blue-500 text-white px-4 py-2 rounded-full
                         flex items-center space-x-2 disabled:bg-blue-300"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <span>{isProcessing ? 'Processing...' : 'Scan Ingredients'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="w-full bg-blue-500 text-white p-4 rounded-lg
                       flex items-center justify-center space-x-2"
            >
              <Camera className="w-6 h-6" />
              <span>Start Scanner</span>
            </button>
          )}
          
          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center mt-2">Processing image... {progress}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rawText && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Detected Text</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{rawText}</pre>
          </CardContent>
        </Card>
      )}

      {detectedIngredients.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Analyzed Ingredients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {detectedIngredients.map((item, index) => (
                <li 
                  key={index}
                  className={`p-2 rounded ${
                    item.allergens.length > 0 ? 'bg-red-100' : 'bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{item.food}</div>
                  <div className="text-sm text-gray-600">Category: {item.category}</div>
                  {item.confidence && (
                    <div className="text-sm text-gray-600">
                      Confidence: {(item.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                  {item.allergens.length > 0 && (
                    <div className="text-sm text-red-600">
                      Allergens: {item.allergens.join(', ')}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {allergenWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Allergen Warning</AlertTitle>
          <AlertDescription>
            <p>The following allergens were detected:</p>
            <ul className="list-disc pl-4 mt-2">
              {allergenWarnings.map((allergen, index) => (
                <li key={index} className="capitalize">{allergen}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FoodAllergenScanner;
