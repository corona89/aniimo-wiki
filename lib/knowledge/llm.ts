// Server-side client for generative loading/answering via Ollama Cloud (glm-5.3).
// Reserved for text generation only (node summaries, final QnA answers);
// classification/routing goes through Jev (see typesafe.ts) to keep costs low.
// Ollama Cloud exposes an OpenAI-compatible endpoint.

export function isLlmConfigured(): boolean {
  return Boolean(process.env.OLLAMA_API_KEY);
}

export async function generate(system: string, user: string): Promise<string> {
  const key = process.env.OLLAMA_API_KEY;
  if (!key) throw new Error("OLLAMA_API_KEY is not set");
  const base = process.env.OLLAMA_BASE_URL ?? "https://ollama.com";
  const model = process.env.OLLAMA_MODEL ?? "glm-5.3";

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Ollama Cloud error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}
