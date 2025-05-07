import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateHealthResponse = async (userInput: string) => {
  try {
    // Check if API key exists
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured in environment variables');
    }

    // Check API key format
    if (!import.meta.env.VITE_GEMINI_API_KEY.startsWith('AIza')) {
      throw new Error('Invalid API key format. Please get a new API key from https://makersuite.google.com/app/apikey');
    }

    // Initialize the model with the correct configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Prepare the prompt
    const prompt = `You are a helpful healthcare assistant. Provide accurate, helpful, and safe medical information. Always include disclaimers about consulting healthcare professionals for medical advice.

User: ${userInput}`;

    console.log('Attempting to generate response...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    console.log('Generation result received');
    
    // Get the response
    const response = await result.response;
    console.log('Response received');
    
    // Extract the text
    const text = response.text();
    console.log('Text extracted from response');
    
    if (!text) {
      throw new Error('Received empty response from Gemini API');
    }
    
    return text;
  } catch (error) {
    console.error('Detailed error in generateHealthResponse:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'Error: Please check your API key configuration. Make sure you have a valid Gemini API key in your .env file.';
      }
      if (error.message.includes('network')) {
        return 'Error: Network issue detected. Please check your internet connection.';
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        return 'Error: The AI service is currently experiencing high demand. Please try again in a few minutes. If the issue persists, you may need to upgrade your API plan or try again later.';
      }
      return `Error: ${error.message}`;
    }
    
    return 'An unexpected error occurred. Please try again later.';
  }
}; 