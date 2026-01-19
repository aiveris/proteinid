// USDA FoodData Central API integration
import { translateToEnglish } from './translationApi';

const USDA_API_KEY = 'tELqrbY4E2SGHc7YigpzBctUPd318XyVCjiHg4WY';
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

export const searchUSDAFoods = async (searchTerm) => {
  try {
    // Translate to English if needed
    const englishTerm = await translateToEnglish(searchTerm);
    
    const response = await fetch(
      `${USDA_API_BASE}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(englishTerm)}&pageSize=10&dataType=Foundation,SR%20Legacy`
    );
    
    if (!response.ok) {
      throw new Error('USDA API request failed');
    }
    
    const data = await response.json();
    
    // Transform data to our format
    return data.foods.map(food => {
      // Find protein nutrient (Protein, nutrient ID 1003)
      const proteinNutrient = food.foodNutrients?.find(
        n => n.nutrientId === 1003 || n.nutrientName?.toLowerCase().includes('protein')
      );
      
      return {
        fdcId: food.fdcId,
        description: food.description,
        brandName: food.brandName,
        protein: proteinNutrient?.value || 0, // per 100g
        servingSize: 100,
        dataType: food.dataType
      };
    }).filter(food => food.protein > 0); // Only return foods with protein data
  } catch (error) {
    console.error('Error searching USDA foods:', error);
    return [];
  }
};

export const getFoodDetails = async (fdcId) => {
  try {
    const response = await fetch(
      `${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('USDA API request failed');
    }
    
    const food = await response.json();
    
    // Find protein nutrient
    const proteinNutrient = food.foodNutrients?.find(
      n => n.nutrient?.id === 1003 || n.nutrient?.name?.toLowerCase().includes('protein')
    );
    
    return {
      fdcId: food.fdcId,
      description: food.description,
      brandName: food.brandName,
      protein: proteinNutrient?.amount || 0,
      servingSize: 100
    };
  } catch (error) {
    console.error('Error getting food details:', error);
    return null;
  }
};
