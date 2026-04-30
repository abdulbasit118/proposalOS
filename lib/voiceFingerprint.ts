export interface VoiceProfile {
  avgSentenceLength: "short" | "medium" | "long";
  formality: "casual" | "semi-formal" | "formal";
  opener: "question" | "statement" | "pain-first";
  tone: string;
  keyPhrases: string[];
}

export function analyzeVoice(samples: string[]): VoiceProfile {
  // If no samples, return default profile
  if (samples.length === 0 || samples.every((s) => s.trim().length === 0)) {
    return {
      avgSentenceLength: "medium",
      formality: "semi-formal",
      opener: "pain-first",
      tone: "professional and helpful",
      keyPhrases: [],
    };
  }

  // Filter out empty samples
  const validSamples = samples.filter((s) => s.trim().length > 0);

  // Combine all samples for analysis
  const combinedText = validSamples.join(" ").toLowerCase();

  // Analyze sentence length
  const sentences = combinedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength =
    sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
      : 15;

  const sentenceLength: VoiceProfile["avgSentenceLength"] =
    avgSentenceLength < 12 ? "short" : avgSentenceLength > 20 ? "long" : "medium";

  // Analyze formality (simple heuristic)
  const formalWords = [
    "would",
    "could",
    "should",
    "shall",
    "hereby",
    "furthermore",
    "moreover",
    "therefore",
    "regarding",
  ];
  const casualWords = [
    "hey",
    "cool",
    "awesome",
    "gonna",
    "wanna",
    "yeah",
    "super",
    "love",
  ];

  const formalCount = formalWords.filter((word) => combinedText.includes(word)).length;
  const casualCount = casualWords.filter((word) => combinedText.includes(word)).length;

  let formality: VoiceProfile["formality"];
  if (formalCount > casualCount) {
    formality = "formal";
  } else if (casualCount > formalCount) {
    formality = "casual";
  } else {
    formality = "semi-formal";
  }

  // Analyze opener style
  const firstSentence = validSamples[0]?.split(/[.!?]+/)[0]?.toLowerCase() || "";
  let opener: VoiceProfile["opener"];
  if (firstSentence.includes("?")) {
    opener = "question";
  } else if (firstSentence.includes("need") || firstSentence.includes("problem")) {
    opener = "pain-first";
  } else {
    opener = "statement";
  }

  // Detect tone (simple heuristic)
  const confidentWords = ["guarantee", "sure", "certain", "definitely", "expert"];
  const humbleWords = ["hope", "try", "believe", "might", "could"];

  const confidentCount = confidentWords.filter((word) => combinedText.includes(word)).length;
  const humbleCount = humbleWords.filter((word) => combinedText.includes(word)).length;

  let tone: string;
  if (confidentCount > humbleCount) {
    tone = "confident and direct";
  } else if (humbleCount > confidentCount) {
    tone = "humble and thoughtful";
  } else {
    tone = "professional and helpful";
  }

  // Extract key phrases (common 2-3 word combinations)
  const keyPhrases = extractKeyPhrases(validSamples);

  return {
    avgSentenceLength: sentenceLength,
    formality,
    opener,
    tone,
    keyPhrases,
  };
}

function extractKeyPhrases(samples: string[]): string[] {
  const combinedText = samples.join(" ").toLowerCase();

  // Common freelancer phrases to look for
  const commonPhrases = [
    "i have",
    "i can",
    "i will",
    "let me",
    "happy to",
    "looking forward",
    "best regards",
    "thank you",
    "best wishes",
    "years of experience",
    "similar projects",
    "quick turnaround",
  ];

  // Find which phrases appear in the text
  const foundPhrases = commonPhrases.filter((phrase) =>
    combinedText.includes(phrase)
  );

  // Return top 3 or empty array
  return foundPhrases.slice(0, 3);
}

export function formatVoiceProfileForPrompt(profile: VoiceProfile): string {
  return `User voice profile:
- Sentence length: ${profile.avgSentenceLength}
- Formality: ${profile.formality}
- Opens with: ${profile.opener} approach
- Tone: ${profile.tone}
- Their common phrases: ${profile.keyPhrases.join(", ") || "N/A"}`;
}
