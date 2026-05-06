import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function askAI(prompt: string, context: string = "") {
  const modelName = "gemini-3.1-pro-preview"; // Optimized for coding
  
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
        temperature: 0.1, // Even lower for absolute precision
        responseMimeType: "text/plain" 
      }
    });

    if (!response.text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    
    // Better error propagation
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = error.message || "An unexpected error occurred.";
    
    if (errorMessage.includes("API key")) errorCode = "INVALID_API_KEY";
    if (errorMessage.includes("quota") || errorMessage.includes("429")) errorCode = "QUOTA_EXCEEDED";
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) errorCode = "NETWORK_ERROR";
    if (errorMessage.includes("safety") || errorMessage.includes("blocked")) errorCode = "SAFETY_BLOCK";

    throw { code: errorCode, message: errorMessage, originalError: error };
  }
}
