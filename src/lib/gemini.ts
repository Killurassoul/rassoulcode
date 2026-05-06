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

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini AI error:", error);
    return "Error communicating with AI. Please check your API key.";
  }
}
