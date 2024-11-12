import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";

// Rest of your component code remains the sameimport React, { useState, useEffect, useRef } from 'react';

// Safely access environment variables
const getEnvVar = (key) => {
  if (typeof window !== 'undefined') {
    return window.ENV?.[key] || '';
  }
  return '';
};

const FoodAllergenScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [allergenWarnings, setAllergenWarnings] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isConfigured, setIsConfigured] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Check if required environment variables are available
    const edamamAppId = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_ID');
    const edamamAppKey = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_KEY');
    const googleCloudApiKey = getEnvVar('NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY');

    setIsConfigured(
      Boolean(edamamAppId && edamamAppKey && googleCloudApiKey)
    );
  }, []);

  // Function to get allergen data from Open Food Facts API
  const fetchAllergenDatabase = async () => {
    try {
      const response = await fetch('https://world.openfoodfacts.org/allergens.json');
      const data = await response.json();
      return data.tags.map(tag => tag.name.toLowerCase());
    } catch (err) {
      console.error('Error fetching allergen database:', err);
      return [];
    }
  };

  const startCamera = async () => {
    try {
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
      }
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  // Function to capture image from video stream
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg').split(',')[1];
  };

  // Function to detect text using Google Cloud Vision API
  const detectText = async (imageBase64) => {
    try {
      setProgress(25);
      const googleCloudApiKey = getEnvVar('NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY');
      
      if (!googleCloudApiKey) {
        throw new Error('Google Cloud API key not configured');
      }

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleCloudApiKey}`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      });

      const data = await response.json();
      if (!data.responses?.[0]?.textAnnotations?.[0]?.description) {
        throw new Error('No text detected in image');
      }

      setProgress(50);
      return data.responses[0].textAnnotations[0].description;
    } catch (err) {
      throw new Error(`Text detection failed: ${err.message}`);
    }
  };

  // Function to analyze ingredients using Edamam API
  const analyzeIngredients = async (text) => {
    try {
      setProgress(75);
      const edamamAppId = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_ID');
      const edamamAppKey = getEnvVar('NEXT_PUBLIC_EDAMAM_APP_KEY');

      if (!edamamAppId || !edamamAppKey) {
        throw new Error('Edamam API credentials not configured');
      }

      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?app_id=${edamamAppId}&app_key=${edamamAppKey}&ingr=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      
      if (!data.hints || data.hints.length === 0) {
        throw new Error('No ingredients found');
      }

      return data.hints.map(hint => ({
        food: hint.food.label,
        category: hint.food.category,
        allergens: hint.food.allergens || []
      }));
    } catch (err) {
      throw new Error(`Ingredient analysis failed: ${err.message}`);
    }
  };

  const processImage = async () => {
    if (!isConfigured) {
      setError('API keys not configured. Please check your environment variables.');
      return;
    }

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
      const detectedText = await detectText(imageBase64);
      
      // Analyze ingredients
      const ingredients = await analyzeIngredients(detectedText);
      setDetectedIngredients(ingredients);

      // Get allergen database
      const allergenDatabase = await fetchAllergenDatabase();
      
      // Check for allergens
      const warnings = ingredients.reduce((acc, item) => {
        const foundAllergens = allergenDatabase.filter(allergen => 
          item.food.toLowerCase().includes(allergen) ||
          item.allergens.some(a => a.toLowerCase().includes(allergen))
        );
        return [...acc, ...foundAllergens];
      }, []);

      setAllergenWarnings([...new Set(warnings)]);
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isConfigured) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
          Please configure the required API keys in your environment variables:
          <ul className="list-disc pl-4 mt-2">
            <li>NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY</li>
            <li>NEXT_PUBLIC_EDAMAM_APP_ID</li>
            <li>NEXT_PUBLIC_EDAMAM_APP_KEY</li>
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

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
                className="w-full rounded-lg"
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

      {detectedIngredients.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Detected Ingredients</span>
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
