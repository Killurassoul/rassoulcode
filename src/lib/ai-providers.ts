/**
 * Multi-provider AI system for CodeForge AI
 * Supports: OpenAI, Anthropic, Google Gemini, OpenRouter, Nvidia NIM, Mistral, DeepSeek
 */

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
  baseUrl: string;
  keyPrefix: string;
}

export interface AIModel {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyPrefix: 'sk-',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, maxOutput: 16384 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, maxOutput: 16384 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, maxOutput: 4096 },
      { id: 'o1-preview', name: 'o1 Preview', contextWindow: 128000, maxOutput: 32768 },
      { id: 'o1-mini', name: 'o1 Mini', contextWindow: 128000, maxOutput: 65536 },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    keyPrefix: 'sk-ant-',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxOutput: 8192 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxOutput: 8192 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, maxOutput: 8192 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, maxOutput: 4096 },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyPrefix: 'AI',
    models: [
      { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', contextWindow: 1048576, maxOutput: 65536 },
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash', contextWindow: 1048576, maxOutput: 65536 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1048576, maxOutput: 8192 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2097152, maxOutput: 8192 },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPrefix: 'sk-or-',
    models: [
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (via OR)', contextWindow: 200000, maxOutput: 8192 },
      { id: 'openai/gpt-4o', name: 'GPT-4o (via OR)', contextWindow: 128000, maxOutput: 16384 },
      { id: 'google/gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro (via OR)', contextWindow: 1048576, maxOutput: 65536 },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B (via OR)', contextWindow: 131072, maxOutput: 4096 },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (via OR)', contextWindow: 163840, maxOutput: 8192 },
    ],
  },
  {
    id: 'nvidia',
    name: 'Nvidia NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyPrefix: 'nvapi-',
    models: [
      { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', contextWindow: 131072, maxOutput: 4096 },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', contextWindow: 131072, maxOutput: 4096 },
      { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', contextWindow: 65536, maxOutput: 4096 },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    keyPrefix: '',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', contextWindow: 128000, maxOutput: 8192 },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', contextWindow: 32000, maxOutput: 8192 },
      { id: 'mistral-small-latest', name: 'Mistral Small', contextWindow: 32000, maxOutput: 8192 },
      { id: 'codestral-latest', name: 'Codestral', contextWindow: 32000, maxOutput: 8192 },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    keyPrefix: 'sk-',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: 128000, maxOutput: 8192 },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', contextWindow: 128000, maxOutput: 8192 },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', contextWindow: 64000, maxOutput: 8192 },
    ],
  },
];

export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id);
}

export function getModel(providerId: string, modelId: string): AIModel | undefined {
  const provider = getProvider(providerId);
  return provider?.models.find(m => m.id === modelId);
}

const SYSTEM_PROMPT = `You are CodeForge AI, an expert autonomous software engineer and coding assistant.
You help users build complete, high-quality software projects.

You have access to the codebase through context provided in the prompt.
You can propose actions in your response using a JSON format when needed.

Available Actions (USE THIS JSON FORMAT IN YOUR RESPONSE IF YOU WANT TO PERFORM AN ACTION):
\`\`\`json
{
  "actions": [
    { "type": "create_file", "path": "src/newFile.ts", "content": "..." },
    { "type": "edit_file", "path": "src/existing.ts", "content": "..." },
    { "type": "delete_file", "path": "src/old.ts" },
    { "type": "run_command", "command": "npm install lodash" },
    { "type": "install_package", "package": "axios" }
  ]
}
\`\`\`

Guidelines:
1. Be concise but thorough.
2. Respond as a senior software engineer.
3. If you want to modify files or run commands, include the JSON block at the end of your response.
4. Only suggest safe commands.
5. When creating files, always provide complete, production-ready code.
6. Use modern best practices and clean code principles.`;

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Call Gemini API directly (different format from OpenAI-compatible APIs)
 */
async function callGeminiAPI(apiKey: string, modelId: string, messages: ChatCompletionMessage[], temperature: number, maxTokens: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const systemMsg = messages.find(m => m.role === 'system');
  const nonSystemMsgs = messages.filter(m => m.role !== 'system');

  const contents = nonSystemMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Call Anthropic API directly (different format from OpenAI-compatible APIs)
 */
async function callAnthropicAPI(apiKey: string, modelId: string, messages: ChatCompletionMessage[], temperature: number, maxTokens: number): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system');
  const nonSystemMsgs = messages.filter(m => m.role !== 'system');

  const body: any = {
    model: modelId,
    max_tokens: maxTokens,
    temperature,
    messages: nonSystemMsgs.map(m => ({ role: m.role, content: m.content })),
  };

  if (systemMsg) {
    body.system = systemMsg.content;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

/**
 * Call OpenAI-compatible API (OpenAI, OpenRouter, Nvidia NIM, Mistral, DeepSeek)
 */
async function callOpenAICompatibleAPI(baseUrl: string, apiKey: string, modelId: string, messages: ChatCompletionMessage[], temperature: number, maxTokens: number, extraHeaders?: Record<string, string>): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Universal AI chat function - routes to the correct provider API
 */
export async function chatWithAI(
  providerId: string,
  modelId: string,
  apiKey: string,
  userMessage: string,
  context: string,
  conversationHistory: ChatCompletionMessage[] = [],
  temperature: number = 0.1,
  maxTokens: number = 8192
): Promise<string> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  if (!apiKey) throw new Error('API key is required. Please set your API key in Settings.');

  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nWorkspace Context:\n${context}` },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  try {
    switch (providerId) {
      case 'gemini':
        return await callGeminiAPI(apiKey, modelId, messages, temperature, maxTokens);

      case 'anthropic':
        return await callAnthropicAPI(apiKey, modelId, messages, temperature, maxTokens);

      case 'openai':
        return await callOpenAICompatibleAPI(provider.baseUrl, apiKey, modelId, messages, temperature, maxTokens);

      case 'openrouter':
        return await callOpenAICompatibleAPI(provider.baseUrl, apiKey, modelId, messages, temperature, maxTokens, {
          'HTTP-Referer': 'https://codeforge-ai.app',
          'X-Title': 'CodeForge AI',
        });

      case 'nvidia':
      case 'mistral':
      case 'deepseek':
        return await callOpenAICompatibleAPI(provider.baseUrl, apiKey, modelId, messages, temperature, maxTokens);

      default:
        throw new Error(`Provider ${providerId} is not yet supported.`);
    }
  } catch (error: any) {
    let errorCode = 'UNKNOWN_ERROR';
    const errorMessage = error.message || 'An unexpected error occurred.';

    if (errorMessage.includes('API key') || errorMessage.includes('api_key') || errorMessage.includes('401')) errorCode = 'INVALID_API_KEY';
    if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('rate')) errorCode = 'QUOTA_EXCEEDED';
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed')) errorCode = 'NETWORK_ERROR';
    if (errorMessage.includes('safety') || errorMessage.includes('blocked') || errorMessage.includes('content')) errorCode = 'SAFETY_BLOCK';

    throw { code: errorCode, message: errorMessage, originalError: error };
  }
}

/**
 * Get AI autocomplete suggestion
 */
export async function getAIAutocomplete(
  providerId: string,
  modelId: string,
  apiKey: string,
  prefix: string,
  suffix: string,
  filename: string,
  projectContext: string
): Promise<string> {
  if (!apiKey) return '';

  const prompt = `You are an AI code completion engine.
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
- Output ONLY source code. No markdown formatting or explanations.`;

  const messages: ChatCompletionMessage[] = [
    { role: 'user', content: prompt },
  ];

  try {
    const provider = getProvider(providerId);
    if (!provider) return '';

    switch (providerId) {
      case 'gemini':
        return await callGeminiAPI(apiKey, modelId, messages, 0.0, 128);
      case 'anthropic':
        return await callAnthropicAPI(apiKey, modelId, messages, 0.0, 128);
      default:
        return await callOpenAICompatibleAPI(provider.baseUrl, apiKey, modelId, messages, 0.0, 128);
    }
  } catch {
    return '';
  }
}
