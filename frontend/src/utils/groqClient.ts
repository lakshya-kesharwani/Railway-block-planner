// src/utils/groqClient.ts
//
// Thin client for Groq's OpenAI-compatible Chat Completions API.
// Docs: https://console.groq.com/docs/api-reference#chat-create
//
// Get a free API key at https://console.groq.com/keys
// Put it in your .env file as: VITE_GROQ_API_KEY=gsk_xxxxxxxx
//
// NOTE: This calls Groq directly from the browser, which is fine for a
// hackathon demo but exposes your API key to anyone who opens devtools.
// For a production deployment, proxy this call through a small backend
// (Node/Express, FastAPI, a Vercel/Netlify function, etc.) instead.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Groq periodically deprecates old model IDs. If you get a
// "model_decommissioned" error, swap this for a current model from
// https://console.groq.com/docs/models
export const GROQ_MODEL = 'openai/gpt-oss-120b';

// Small, fast fallback model — used automatically if the primary model
// request fails (e.g. rate limited or decommissioned).
export const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqConfigError extends Error {}
export class GroqRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!key || key.trim() === '' || key.includes('your_groq_api_key')) {
    throw new GroqConfigError(
      'No Groq API key found. Add VITE_GROQ_API_KEY to your .env file (get a free key at https://console.groq.com/keys), then restart the dev server.'
    );
  }
  return key;
}

async function callGroq(messages: ChatMessage[], model: string): Promise<string> {
  const apiKey = getApiKey();

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 700,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new GroqRequestError(
      `Groq API error (${response.status}): ${errText || response.statusText}`,
      response.status
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new GroqRequestError('Groq API returned an empty response.');
  }
  return content as string;
}

/**
 * Send a chat completion request to Groq, automatically retrying once
 * with a fallback model if the primary model is unavailable/decommissioned.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  try {
    return await callGroq(messages, GROQ_MODEL);
  } catch (err) {
    if (err instanceof GroqConfigError) throw err;
    // Retry once with the fallback model (covers deprecated/renamed models)
    try {
      return await callGroq(messages, GROQ_FALLBACK_MODEL);
    } catch (fallbackErr) {
      if (fallbackErr instanceof GroqRequestError) throw fallbackErr;
      throw err;
    }
  }
}
