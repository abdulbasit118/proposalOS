import OpenAI from "openai";
import { NextResponse } from "next/server";

type RequestBody = {
  jobDescription?: string;
  voiceProfile?: string;
};

type ProposalPayload = {
  proposal: string;
  clientPainPoint: string;
  keySignals: string[];
};

const SYSTEM_PROMPT = `You must respond with ONLY a JSON object.
Start your response with { and end with }
Absolutely no text before { or after }
You are an expert freelance proposal writer.
- Analyze the job post: find client pain point, urgency, budget signals
- Write a proposal matching the user voice profile exactly
- Never start with 'I'
- Open by addressing client's specific pain
- Under 220 words
- Sound human, not AI
- No buzzwords: passionate, dedicated, expert, innovative
- Close with a soft next step
IMPORTANT: Your entire response must be ONLY a valid JSON object. No markdown, no backticks, no explanation text before or after. Just raw JSON.`;

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const MAX_PARSE_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function cleanJsonString(content: string): string {
  const withoutCodeFences = content.replace(/```json/gi, "").replace(/```/g, "");
  const firstBraceIndex = withoutCodeFences.indexOf("{");
  const lastBraceIndex = withoutCodeFences.lastIndexOf("}");

  if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
    return withoutCodeFences.trim();
  }

  return withoutCodeFences.slice(firstBraceIndex, lastBraceIndex + 1).trim();
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function parseResponse(content: string): ProposalPayload | null {
  try {
    const cleaned = cleanJsonString(content);
    const parsed = JSON.parse(cleaned) as ProposalPayload;
    if (
      typeof parsed?.proposal !== "string" ||
      typeof parsed?.clientPainPoint !== "string" ||
      !Array.isArray(parsed?.keySignals) ||
      !parsed.keySignals.every((signal) => typeof signal === "string")
    ) {
      return null;
    }

    return {
      proposal: parsed.proposal.trim(),
      clientPainPoint: parsed.clientPainPoint.trim(),
      keySignals: parsed.keySignals.map((signal) => signal.trim()).filter(Boolean),
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY environment variable." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const jobDescription = body.jobDescription?.trim();
  const voiceProfile = body.voiceProfile?.trim();

  if (!jobDescription || !voiceProfile) {
    return NextResponse.json(
      { error: "Both jobDescription and voiceProfile are required." },
      { status: 400 },
    );
  }

  try {
    for (let attempt = 1; attempt <= MAX_PARSE_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const completion = await client.chat.completions.create(
        {
          model: "openai/gpt-oss-120b:free",
          temperature: 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Job description:\n${jobDescription}\n\nVoice profile:\n${voiceProfile}\n\nReturn JSON only with this exact shape:
{
  "proposal": "string",
  "clientPainPoint": "string",
  "keySignals": ["string"]
}`,
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        if (attempt < MAX_PARSE_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return NextResponse.json({ error: "No response content from model." }, { status: 502 });
      }

      const parsed = parseResponse(content);
      if (parsed) {
        return NextResponse.json(parsed, { status: 200 });
      }

      if (attempt < MAX_PARSE_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }

    return NextResponse.json({ error: "Model returned invalid JSON payload format." }, { status: 502 });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "timeout" }, { status: 504 });
    }
    if (error instanceof OpenAI.APIError) {
      const status = error.status ?? 502;
      return NextResponse.json(
        { error: error.message || "OpenRouter API request failed." },
        { status },
      );
    }

    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
