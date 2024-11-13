import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from "../components/ui/progress";
import type { EnvVarKey } from '../types/environment';

// Safely access environment variables with explicit typing
const getEnvVar = (key: EnvVarKey): string => {
  if (typeof window !== 'undefined') {
    return window.ENV?.[key] || '';
  }
  return '';
};

const FoodAllergenScanner = () => {
  // Rest of your component code...
};

export default FoodAllergenScanner;
