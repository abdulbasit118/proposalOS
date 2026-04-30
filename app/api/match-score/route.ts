import OpenAI from "openai";
import { NextResponse } from "next/server";

type RequestBody = {
  jobDescription?: string;
  userSkills?: string;
  userExperience?: string;
};

type Verdict = "Strong Match" | "Good Match" | "Weak Match";

type MatchScorePayload = {
  score: number;
  verdict: Verdict;
  strengths: string[];
  gaps: string[];
  improvement_tip: string;
};

const SYSTEM_PROMPT = `You must respond with ONLY a JSON object.
Start your response with { and end with }
Absolutely no text before { or after }
You are a freelance job match analyzer.
Analyze how well this freelancer matches the job.
Return ONLY valid JSON, nothing else.
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

function isValidVerdict(value: string): value is Verdict {
  return value === "Strong Match" || value === "Good Match" || value === "Weak Match";
}

function parseResponse(content: string): MatchScorePayload | null {
  try {
    const cleaned = cleanJsonString(content);
    const parsed = JSON.parse(cleaned) as MatchScorePayload;
    if (
      typeof parsed?.score !== "number" ||
      parsed.score < 0 ||
      parsed.score > 100 ||
      !Number.isFinite(parsed.score) ||
      typeof parsed?.verdict !== "string" ||
      !isValidVerdict(parsed.verdict) ||
      !Array.isArray(parsed?.strengths) ||
      parsed.strengths.length !== 3 ||
      !parsed.strengths.every((item) => typeof item === "string" && item.trim().length > 0) ||
      !Array.isArray(parsed?.gaps) ||
      parsed.gaps.length !== 2 ||
      !parsed.gaps.every((item) => typeof item === "string" && item.trim().length > 0) ||
      typeof parsed?.improvement_tip !== "string" ||
      parsed.improvement_tip.trim().length === 0
    ) {
      return null;
    }

    return {
      score: Math.round(parsed.score),
      verdict: parsed.verdict,
      strengths: parsed.strengths.map((item) => item.trim()),
      gaps: parsed.gaps.map((item) => item.trim()),
      improvement_tip: parsed.improvement_tip.trim(),
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
  const userSkills = body.userSkills?.trim();
  const userExperience = body.userExperience?.trim();

  if (!jobDescription || !userSkills || !userExperience) {
    return NextResponse.json(
      { error: "jobDescription, userSkills, and userExperience are required." },
      { status: 400 },
    );
  }

  try {
    for (let attempt = 1; attempt <= MAX_PARSE_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const completion = await client.chat.completions.create(
        {
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          temperature: 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Job description:
${jobDescription}

Freelancer skills:
${userSkills}

Freelancer experience:
${userExperience}

Return JSON only with this exact shape:
{
  "score": 0,
  "verdict": "Strong Match",
  "strengths": ["string", "string", "string"],
  "gaps": ["string", "string"],
  "improvement_tip": "string"
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
