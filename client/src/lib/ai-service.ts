import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google AI with the API key
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Create a client
let genAI: GoogleGenerativeAI | null = null;

export function initializeGoogleAI(apiKey: string = API_KEY) {
  if (!apiKey) {
    console.warn("Google AI API key is not set!");
    return null;
  }
  
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

if (API_KEY) {
  initializeGoogleAI();
}

/**
 * Gets the Google Gemini model with the specified configuration
 * @param modelName The name of the model to use
 * @param systemPrompt The system prompt to use
 * @returns The model instance
 */
export function getGeminiModel(modelName = "gemini-1.5-pro", systemPrompt?: string) {
  if (!genAI) {
    throw new Error("Google AI not initialized. Call initializeGoogleAI first.");
  }
  
  // Get the model
  const model = genAI.getGenerativeModel({ model: modelName });
  
  // Initialize chat with system prompt if provided
  if (systemPrompt) {
    return model.startChat({
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I'll help you with that request, following all the guidelines you've provided." }],
        }
      ],
    });
  }
  
  return model;
}

/**
 * Generates text with the Gemini model
 * @param prompt The prompt to generate text from
 * @param systemPrompt Optional system prompt to guide the model
 * @returns The generated text
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    const model = getGeminiModel("gemini-1.5-pro", systemPrompt);
    
    if ('sendMessage' in model) {
      // It's a chat model
      const result = await model.sendMessage(prompt);
      return result.response.text();
    } else {
      // It's a regular generative model
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  } catch (error) {
    console.error("Error generating text:", error);
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates text with structured data (JSON) output
 * @param prompt The prompt to generate text from
 * @param responseSchema The JSON schema for the response
 * @param systemPrompt Optional system prompt to guide the model
 * @returns The generated structured data
 */
export async function generateStructuredData<T>(
  prompt: string,
  responseSchema: any,
  systemPrompt?: string
): Promise<T> {
  try {
    if (!genAI) {
      throw new Error("Google AI not initialized");
    }
    
    // Add instructions to return JSON
    const jsonPrompt = `${prompt}\n\nProvide your response in valid JSON format that conforms to this schema: ${JSON.stringify(responseSchema)}`;
    
    // Generate the text
    const model = getGeminiModel("gemini-1.5-pro", systemPrompt);
    
    let jsonText = "";
    if ('sendMessage' in model) {
      // It's a chat model
      const result = await model.sendMessage(jsonPrompt);
      jsonText = result.response.text();
    } else {
      // It's a regular generative model
      const result = await model.generateContent(jsonPrompt);
      jsonText = result.response.text();
    }
    
    // Extract JSON from the text (in case the model adds explanation)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from the response");
    }
    
    // Parse the JSON
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error generating structured data:", error);
    throw new Error(`Failed to generate structured data: ${error instanceof Error ? error.message : String(error)}`);
  }
}