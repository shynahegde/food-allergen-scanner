'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AlertTriangle, Check, X, Info } from 'lucide-react';

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

const FoodAnalysis = ({ ingredients, rawText }: { ingredients: any[], rawText: string }) => {
  const analyzeFood = (): NutritionAnalysis => {
    const lowerText = rawText.toLowerCase();
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

  const analysis = analyzeFood();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Food Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Diet Compatibility */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Diet Compatibility</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <span className={analysis.isGlutenFree ? 'text-green-500' : 'text-red-500'}>
                  {analysis.isGlutenFree ? <Check size={16} /> : <X size={16} />}
                </span>
                Gluten Free
              </div>
              <div className="flex items-center gap-2">
                <span className={analysis.isVegan ? 'text-green-500' : 'text-red-500'}>
                  {analysis.isVegan ? <Check size={16} /> : <X size={16} />}
                </span>
                Vegan
              </div>
            </div>
          </div>

          {/* Ingredient Analysis */}
          {analysis.processedIngredients.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Processed Ingredients</h3>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <ul className="list-disc pl-5 text-sm text-yellow-800">
                  {analysis.processedIngredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Nutrition Warnings */}
          {analysis.warnings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Warnings
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {analysis.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safe for Diet */}
          {analysis.safeForDiet.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Safe for
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.safeForDiet.map((diet, index) => (
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
    </div>
  );
};

export default FoodAnalysis;
