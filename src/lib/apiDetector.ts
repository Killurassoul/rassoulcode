/**
 * Détecte automatiquement le provider et le modèle en fonction du format de la clé API
 */

export interface DetectedAPI {
  provider: "gemini" | "openai" | "anthropic" | "cohere" | "huggingface" | "unknown";
  model: string;
  displayName: string;
  isValid: boolean;
}

export function detectAPIKey(apiKey: string): DetectedAPI {
  const key = apiKey.trim();

  // Gemini API (AIza...)
  if (key.startsWith("AIza")) {
    return {
      provider: "gemini",
      model: "gemini-3.1-pro-preview",
      displayName: "Google Gemini 3.1 Pro",
      isValid: true,
    };
  }

  // OpenAI (sk-...)
  if (key.startsWith("sk-")) {
    return {
      provider: "openai",
      model: "gpt-4-turbo",
      displayName: "OpenAI GPT-4 Turbo",
      isValid: true,
    };
  }

  // Anthropic Claude (sk-ant-...)
  if (key.startsWith("sk-ant-")) {
    return {
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      displayName: "Anthropic Claude 3 Opus",
      isValid: true,
    };
  }

  // Cohere (co_...)
  if (key.startsWith("co_")) {
    return {
      provider: "cohere",
      model: "command-r-plus",
      displayName: "Cohere Command R+",
      isValid: true,
    };
  }

  // HuggingFace (hf_...)
  if (key.startsWith("hf_")) {
    return {
      provider: "huggingface",
      model: "meta-llama/Llama-2-70b-chat-hf",
      displayName: "HuggingFace Llama 2 70B",
      isValid: true,
    };
  }

  // Clé générique ou format inconnu
  if (key.length > 20) {
    return {
      provider: "unknown",
      model: "gpt-3.5-turbo", // Fallback par défaut
      displayName: "Modèle AI générique",
      isValid: true, // On accepte même si on reconnaît pas le format
    };
  }

  return {
    provider: "unknown",
    model: "",
    displayName: "Format de clé API non reconnu",
    isValid: false,
  };
}

export async function validateAPIKey(apiKey: string, provider: string): Promise<boolean> {
  try {
    switch (provider) {
      case "gemini":
        return await validateGemini(apiKey);
      case "openai":
        return await validateOpenAI(apiKey);
      case "anthropic":
        return await validateAnthropic(apiKey);
      case "cohere":
        return await validateCohere(apiKey);
      case "huggingface":
        return await validateHuggingFace(apiKey);
      default:
        return true; // Accepter les clés inconnues
    }
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
}

async function validateGemini(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function validateOpenAI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateAnthropic(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": apiKey },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateCohere(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.cohere.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateHuggingFace(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://huggingface.co/api/whoami", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
