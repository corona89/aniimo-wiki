// Server-side client for TypeSafe's Jev (System One) API.
// Used for cheap, structured classification/routing (no text generation).
// Docs: https://docs.typesafe.ai/api  |  POST https://api.typesafe.ai/v1/systemone

export type ChoiceQuestion = { type: "choice"; instructions: string; criteria: Record<string, string> };
export type ScoreQuestion = { type: "score"; instructions: string; criteria: string[] };
export type NoulQuestion = { type: "noul"; instructions: string };
export type Question = ChoiceQuestion | ScoreQuestion | NoulQuestion;

export type ChoiceAnswer = { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> };
export type ScoreAnswer = { type: "score"; score: number; confidence: number; probabilities: Record<string, number> };
export type NoulAnswer = { type: "noul"; noul: number };
export type Answer = ChoiceAnswer | ScoreAnswer | NoulAnswer;

export type SystemOneResponse = {
  model: string;
  answers: Record<string, Answer>;
  usage?: { input_tokens: number; output_tokens: number };
};

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

export function isTypeSafeConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY);
}

/** Evaluate typed questions against a state. All questions run in parallel server-side. */
export async function systemOne(
  state: string,
  questions: Record<string, Question>,
  model = process.env.TYPESAFE_MODEL ?? "jev-latest",
): Promise<SystemOneResponse> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error("TYPESAFE_API_KEY is not set");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state, model, questions }),
  });
  if (!res.ok) throw new Error(`TypeSafe API error ${res.status}: ${await res.text()}`);
  return (await res.json()) as SystemOneResponse;
}
