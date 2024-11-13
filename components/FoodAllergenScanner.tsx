import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// ... (keep existing type definitions)

const FoodAllergenScanner = () => {
  // ... (keep existing state variables)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to handle file selection
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

  // Function to handle file drop
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

  // Function to handle drag over
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Function to process uploaded file
  const processUploadedImage = async () => {
    if (!selectedFile || !previewUrl) {
      setError('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Convert the file to base64
      const base64Image = previewUrl.split(',')[1];
      
      // Detect text in image
      setProgress(33);
      const detectedText = await detectText(base64Image);
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

  return (
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
              {/* Existing camera UI */}
              {!isScanning ? (
                <button
                  onClick={startCamera}
                  disabled={!isCameraSupported || !isSecureContext}
                  className="w-full bg-blue-500 text-white p-4 rounded-lg
                           flex items-center justify-center space-x-2
                           disabled:bg-gray-300 disabled:cursor-not-allowed"
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

      {/* Keep existing error and results display code */}
    </div>
  );
};

export default FoodAllergenScanner;
