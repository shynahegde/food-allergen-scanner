'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2, Upload, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import ClientOnly from './ClientOnly';

interface AnalysisResult {
  ingredientsText: string;
  ingredients: string[];
  allergens: string[];
  isGlutenFree: boolean;
  isVegan: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  warnings: string[];
  safeForDiet: string[];
  processedIngredients: string[];
  highSugar: boolean;
  confidence: 'high' | 'medium' | 'low';
}

const FoodAllergenScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  };

  const captureImageBase64 = (): string | null => {
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

  const analyzeImage = async (imageBase64: string, mediaType = 'image/jpeg') => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(20);
    setProgressLabel('Sending to AI…');

    try {
      setProgress(50);
      setProgressLabel('Analyzing ingredients…');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mediaType })
      });

      setProgress(85);
      setProgressLabel('Processing results…');

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');

      setResult(data);
      setProgress(100);
      setProgressLabel('Done!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgressLabel('');
    }
  };

  const handleScanCapture = async () => {
    const base64 = captureImageBase64();
    if (!base64) { setError('Failed to capture image from camera'); return; }
    setPreviewUrl(`data:image/jpeg;base64,${base64}`);
    stopCamera();
    await analyzeImage(base64, 'image/jpeg');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setError(null);
      const base64 = dataUrl.split(',')[1];
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
      await analyzeImage(base64, mediaType);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) { setError('Please drop an image file'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setError(null);
      const base64 = dataUrl.split(',')[1];
      await analyzeImage(base64, file.type as any);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const allergenColor = (count: number) =>
    count === 0 ? 'text-green-600 bg-green-50 border-green-200'
    : count <= 2 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <ClientOnly>
      <div className="max-w-md mx-auto p-4">
        <canvas ref={canvasRef} className="hidden" />

        {/* Input area — hide once we have results */}
        {!result && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Scan Food Label</CardTitle>
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
                      disabled={isProcessing}
                      className="w-full bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Camera className="w-6 h-6" />
                      <span>Start Camera</span>
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
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                        <button
                          onClick={stopCamera}
                          className="bg-gray-700 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleScanCapture}
                          disabled={isProcessing}
                          className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 disabled:bg-blue-300"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Scan Label</span>
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upload">
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed rounded-lg p-8 text-center"
                  >
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                        {isProcessing && (
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">{progressLabel}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-gray-500">
                          <Upload className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-lg font-medium">Drag & drop an image, or click to select</p>
                          <p className="text-sm mt-1">Take a clear photo of the ingredients list</p>
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
                          disabled={isProcessing}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50"
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
                  <p className="text-sm text-center mt-2 text-gray-500">{progressLabel}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <button onClick={reset} className="block mt-2 underline text-sm">Try again</button>
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Allergen summary */}
            <Card className={`border ${allergenColor(result.allergens.length)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold mb-1">
                      {result.allergens.length === 0 ? '✓ No major allergens detected' : `⚠ ${result.allergens.length} allergen${result.allergens.length > 1 ? 's' : ''} found`}
                    </h2>
                    {result.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.allergens.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-sm font-medium capitalize">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-2 mt-1">AI confidence: {result.confidence}</span>
                </div>
              </CardContent>
            </Card>

            {/* Diet badges */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-medium mb-3">Dietary Info</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Gluten-Free', ok: result.isGlutenFree },
                    { label: 'Vegan', ok: result.isVegan },
                    { label: 'Dairy-Free', ok: result.isDairyFree },
                    { label: 'Nut-Free', ok: result.isNutFree },
                  ].map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                      {label}
                    </div>
                  ))}
                </div>
                {result.highSugar && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    High sugar content
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">Warnings</h3>
                  <ul className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Ingredients list */}
            {result.ingredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Detected Ingredients ({result.ingredients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {result.ingredients.map((ing, i) => {
                      const isAllergen = result.allergens.some(a => ing.toLowerCase().includes(a.toLowerCase()));
                      const isProcessed = result.processedIngredients.some(p => ing.toLowerCase().includes(p.toLowerCase()));
                      return (
                        <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${
                          isAllergen ? 'bg-red-100 text-red-800 font-medium'
                          : isProcessed ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                          {ing}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw text */}
            {result.ingredientsText && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Raw Label Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-xs text-gray-600">{result.ingredientsText}</pre>
                </CardContent>
              </Card>
            )}

            {/* Scan again */}
            <button
              onClick={reset}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Scan Another Label
            </button>
          </div>
        )}
      </div>
    </ClientOnly>
  );
};

export default FoodAllergenScanner;
