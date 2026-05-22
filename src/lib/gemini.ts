import { GoogleGenAI } from "@google/genai";
import { useIDEStore } from "../store/useIDEStore.ts";

const getAI = () => {
  const { apiKey } = useIDEStore.getState();
  
  if (!apiKey) {
    throw new Error("Aucune clé API configurée. Veuillez configurer votre clé dans les paramètres.");
  }
  
  return new GoogleGenAI({ apiKey });
};

export async function askAI(prompt: string, context: string = "") {
  const { aiModel } = useIDEStore.getState();
  const ai = getAI();
  
  const modelName = aiModel || "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are CodeForge AI, an expert autonomous software engineer.
    You help users build complete, high-quality software projects.
    
    You have access to the codebase through context provided in the prompt.
    You can propose actions in your response using a JSON format when needed.
    
    Current Workspace Context:
    ${context}
    
    Available Actions (YOU MUST USE THIS JSON FORMAT IN YOUR RESPONSE IF YOU WANT TO PERFORM AN ACTION):
    \`\`\`json
    {
      "actions": [
        { "type": "create_file", "path": "src/newFile.ts", "content": "..." },
        { "type": "run_command", "command": "npm install lodash" }
      ]
    }
    \`\`\`
    
    Guidelines:
    1. Be concise but helpful.
    2. Respond as a senior software engineer.
    3. If you want to modify files or run commands, include the JSON block at the end of your response.
    4. Only suggest safe commands.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "text/plain" 
      }
    });

    if (!response.text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = error.message || "An unexpected error occurred.";
    
    if (errorMessage.includes("API key")) errorCode = "INVALID_API_KEY";
    if (errorMessage.includes("quota") || errorMessage.includes("429")) errorCode = "QUOTA_EXCEEDED";
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) errorCode = "NETWORK_ERROR";
    if (errorMessage.includes("safety") || errorMessage.includes("blocked")) errorCode = "SAFETY_BLOCK";
    if (errorMessage.includes("Aucune clé")) errorCode = "NO_API_KEY";

    throw { code: errorCode, message: errorMessage, originalError: error };
  }
}

export async function getAutocomplete(prefix: string, suffix: string, filename: string, projectContext: string = "") {
  const ai = getAI();
  
  const prompt = `
    You are an AI code completion engine.
    Complete the code for the file "${filename}" in the following project:
    
    PROJECT STRUCTURE:
    ${projectContext}
    
    FILE CONTEXT (PREFIX):
    ${prefix}
    
    FILE CONTEXT (SUFFIX):
    ${suffix}
    
    INSTRUCTIONS:
    - Provide ONLY the code that should be inserted between the prefix and suffix.
    - Do not repeat the prefix or suffix.
    - Be concise and provide exactly what's needed to complete the current thought/statement.
    - Output ONLY source code. No markdown formatting like \`\`\` or explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        temperature: 0.0,
        maxOutputTokens: 128,
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Autocomplete error:", error);
    return "";
  }
}
