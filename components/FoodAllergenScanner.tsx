import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";

// Define the possible environment variable keys
type EnvKeys = 'NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY' | 'NEXT_PUBLIC_EDAMAM_APP_ID' | 'NEXT_PUBLIC_EDAMAM_APP_KEY';

// Define window.ENV type
declare global {
  interface Window {
    ENV?: {
      [key in EnvKeys]: string;
    };
  }
}

// Safely access environment variables with proper typing
const getEnvVar = (key: EnvKeys): string => {
  if (typeof window !== 'undefined') {
    return window.ENV?.[key] || '';
  }
  return '';
};

// Rest of your component code remains the same...
