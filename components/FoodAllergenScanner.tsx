'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import ClientOnly from './ClientOnly';

// Types
interface Ingredient {
  food: string;
  category: string;
  allergens: string[];
  confidence?: number;
}

interface NutritionAnalysis {
  allergens: string[];
  isGlutenFree: boolean;
  isVegan: boolean;
  processedIngredients: string[];
  nutritionFacts: {
    highSugar: boolean;
    highFat: boolean;
    highCholesterol: boolean;
    carbohydrates: boolean;
  };
  warnings: string[];
  safeForDiet: string[];
}

type EnvVarKey = 'NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY' | 'NEXT_PUBLIC_EDAMAM_APP_ID' | 'NEXT_PUBLIC_EDAMAM_APP_KEY';

// Constants
const COMMON_ALLERGENS = [
  'milk', 'egg', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soybeans',
  'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
];

const PROCESSED_INGREDIENTS = [
  'maltodextrin', 'corn syrup', 'high fructose', 'modified starch',
  'artificial', 'preservative', 'sodium nitrite', 'msg', 'hydrolyzed',
  'hydrogenated', 'flavor', 'colour', 'dextrose', 'glucose'
];

const VEGAN_INGREDIENTS = [
  'meat', 'chicken', 'fish', 'egg', 'milk', 'dairy', 'whey', 'casein',
  'honey', 'gelatin', 'shellac', 'lanolin', 'collagen', 'albumen'
];

const GLUTEN_INGREDIENTS = [
  'wheat', 'barley', 'rye', 'malt', 'brewer', 'triticale', 'spelt',
  'semolina', 'farina', 'graham'
];

const HIGH_SUGAR_INDICATORS = [
  'sugar', 'syrup', 'dextrose', 'fructose', 'sucrose', 'honey',
  'agave', 'molasses', 'corn sweetener'
];

const getEnvVar = (key: EnvVarKey): string => {
  return typeof window !== 'undefined' ? (window as any).ENV?.[key] || '' : '';
};

const FoodAllergenScanner = () => {
  // State declarations
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<Ingredient[]>([]);
  const [allergenWarnings, setAllergenWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nutritionAnalysis, setNutritionAnalysis] = useState<NutritionAnalysis | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Camera handling functions
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

  // Image capture and processing functions
  const captureImage = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg').split(',')[1];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
      } else {
        setError('Please select an image file (JPG, PNG, etc.)');
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setError('Please drop an image file (JPG, PNG, etc.)');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // API interaction functions
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

    const ingredients = text
      .toLowerCase()
      .split(/[,;\n]/)
      .map(i => i.trim())
      .filter(i => i.length > 2);

    const results: Ingredient[] = [];

    for (const ingredient of ingredients) {
      try {
        const response = await fetch(
          `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(ingredient)}`
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (data.hints && data.hints.length > 0) {
          const foodInfo = data.hints[0].food;
          
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

  // Analysis functions
  const analyzeFood = (text: string): NutritionAnalysis => {
    const lowerText = text.toLowerCase();
    const analysis: NutritionAnalysis = {
      allergens: [],
      isGlutenFree: true,
      isVegan: true,
      processedIngredients: [],
      nutritionFacts: {
        highSugar: false,
        highFat: false,
        highCholesterol: false,
        carbohydrates: false
      },
      warnings: [],
      safeForDiet: []
    };

    // Check for processed ingredients
    PROCESSED_INGREDIENTS.forEach(ingredient => {
      if (lowerText.includes(ingredient.toLowerCase())) {
        analysis.processedIngredients.push(ingredient);
        analysis.warnings.push('Contains processed ingredients');
      }
    });

    // Check for vegan status
    VEGAN_INGREDIENTS.forEach(ingredient => {
      if (lowerText.includes(ingredient.toLowerCase())) {
        analysis.isVegan = false;
        analysis.warnings.push('Not suitable for vegans');
      }
    });

    // Check for gluten
    GLUTEN_INGREDIENTS.forEach(ingredient => {
      if (lowerText.includes(ingredient.toLowerCase())) {
        analysis.isGlutenFree = false;
        analysis.warnings.push('Contains gluten');
      }
    });

    // Check for high sugar
    if (HIGH_SUGAR_INDICATORS.some(sugar => lowerText.includes(sugar.toLowerCase()))) {
      analysis.nutritionFacts.highSugar = true;
      analysis.warnings.push('High sugar content');
    }

    // Add positive diet indicators
    if (analysis.isGlutenFree) analysis.safeForDiet.push('Gluten-Free');
    if (analysis.isVegan) analysis.safeForDiet.push('Vegan');
    if (analysis.processedIngredients.length === 0) analysis.safeForDiet.push('All Natural');

    return analysis;
  };

  const processImage = async (imageBase64?: string) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Get image data
      const base64Image = imageBase64 || captureImage();
      if (!base64Image) {
        throw new Error('Failed to capture image');
      }

      // Detect text in image
      setProgress(33);
      const detectedText = await detectText(base64Image);
      setRawText(detectedText);
      
      // Analyze ingredients
      setProgress(66);
      const ingredients = await analyzeIngredients(detectedText);
      setDetectedIngredients(ingredients);

      // Perform nutrition analysis
      const analysis = analyzeFood(detectedText);
      setNutritionAnalysis(analysis);

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

  const processUploadedImage = async () => {
    if (!previewUrl) {
      setError('Please select an image first');
      return;
    }

    const base64Image = previewUrl.split(',')[1];
    await processImage(base64Image);
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
    <ClientOnly>
      <div className="max-w-md mx-auto p-4">
        <canvas ref={canvasRef} className="hidden" />

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Food Allergen Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="camera">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="camera">Camera</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>

              <TabsContent value="camera">
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    className="w-full bg-blue-500 text-white p-4 rounded-lg
                             flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-6 h-6" />
                    <span>Start Scanner</span>
                  </button>
                ) : (
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
                      onClick={() => processImage()}
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
                )}
              </TabsContent>

              <TabsContent value="upload">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed rounded-lg p-8 text-center"
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          Remove
                        </button>
                        <button
                          onClick={processUploadedImage}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg
                                   flex items-center gap-2 disabled:bg-blue-300"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5" />
                              <span>Analyze Image</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-gray-500">
                        <Upload className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">
                          Drag and drop an image here, or click to select
                        </p>
                        <p className="text-sm">
                          Supports JPG, PNG images of food packaging
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg
                                 inline-flex items-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Select Image</span>
                      </button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

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

        {nutritionAnalysis && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Nutrition Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className={nutritionAnalysis.isGlutenFree ? 'text-green-500' : 'text-red-500'}>
                    {nutritionAnalysis.isGlutenFree ? <Check size={16} /> : <X size={16} />}
                  </span>
                  Gluten Free
                </div>
                <div className="flex items-center gap-2">
                  <span className={nutritionAnalysis.isVegan ? 'text-green-500' : 'text-red-500'}>
                    {nutritionAnalysis.isVegan ? <Check size={16} /> : <X size={16} />}
                  </span>
                  Vegan
                </div>
              </div>

              {nutritionAnalysis.warnings.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Warnings</h3>
                  <ul className="list-disc pl-5 text-sm text-red-600">
                    {nutritionAnalysis.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {nutritionAnalysis.safeForDiet.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Suitable for</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutritionAnalysis.safeForDiet.map((diet, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {diet}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
    </ClientOnly>
  );
};

export default FoodAllergenScanner;
