// src/i18n/recipes.ts
// 只提供被 import 需要的最小結構，避免 "Module not found"。
export type NutritionTranslationKey =
  | 'calories'
  | 'protein'
  | 'fat'
  | 'carbohydrates'
  | 'fiber'
  | 'vitaminC'
  | 'vitaminA'
  | 'iron'
  | 'calcium'
  | 'potassium'
  | 'sodium';

export const NUTRITION_KEYS: readonly NutritionTranslationKey[] = [
  'calories',
  'protein',
  'fat',
  'carbohydrates',
  'fiber',
  'vitaminC',
  'vitaminA',
  'iron',
  'calcium',
  'potassium',
  'sodium',
] as const;
