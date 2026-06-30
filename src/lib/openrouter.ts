// google/gemini-2.0-flash-lite: 가장 저렴한 안정 모델 (~$0.075/1M tokens)
export const OPENROUTER_MODEL = 'google/gemini-2.0-flash-lite';

export async function callOpenRouter(prompt: string): Promise<string> {
  const res = await fetch('/api/openrouter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error('Failed to call OpenRouter API');
  }
  const data = await res.json() as any;
  return data.content;
}

export function parseJson<T>(text: string): T {
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error('Failed to parse JSON', text, e);
    return {} as T;
  }
}
