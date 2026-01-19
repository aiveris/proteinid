// MyMemory Translation API (Free tier: 1000 words/day)
const MYMEMORY_API_BASE = 'https://api.mymemory.translated.net';

export const translateToEnglish = async (text) => {
  try {
    // If text is already in English (basic check), return as is
    const hasLithuanianChars = /[ąčęėįšųūž]/i.test(text);
    if (!hasLithuanianChars && /^[a-zA-Z\s]+$/.test(text)) {
      return text;
    }

    const response = await fetch(
      `${MYMEMORY_API_BASE}/get?q=${encodeURIComponent(text)}&langpair=lt|en`
    );
    
    if (!response.ok) {
      console.warn('Translation API request failed, using original text');
      return text;
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    return text;
  } catch (error) {
    console.error('Error translating text:', error);
    return text; // Return original text if translation fails
  }
};

export const detectLanguage = (text) => {
  // Simple detection based on Lithuanian characters
  const lithuanianChars = /[ąčęėįšųūž]/i;
  return lithuanianChars.test(text) ? 'lt' : 'en';
};
