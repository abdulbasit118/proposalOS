"use client";

import { useEffect, useState } from "react";

type MatchScoreResponse = {
  score: number;
  verdict: "Strong Match" | "Good Match" | "Weak Match";
  strengths: string[];
  gaps: string[];
  improvement_tip: string;
};

type ProposalResponse = {
  proposal: string;
  clientPainPoint: string;
  keySignals: string[];
};

const FETCH_TIMEOUT_MS = 120000;
const LOADING_MESSAGES = [
  "Analyzing job post...",
  "Finding key signals...",
  "Calculating match score...",
  "Crafting your proposal...",
  "Almost ready...",
] as const;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function ProposalGenerator() {
  const [jobDescription, setJobDescription] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [userExperience, setUserExperience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [matchData, setMatchData] = useState<MatchScoreResponse | null>(null);
  const [proposalData, setProposalData] = useState<ProposalResponse | null>(null);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (matchData && proposalData) {
      setShowResults(false);
      const timer = window.setTimeout(() => setShowResults(true), 20);
      return () => window.clearTimeout(timer);
    }
  }, [matchData, proposalData]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const scoreColorClass = (score: number) => {
    if (score > 70) return "text-emerald-400";
    if (score >= 40) return "text-yellow-300";
    return "text-red-400";
  };

  const submit = async () => {
    if (!jobDescription.trim() || !userSkills.trim() || !userExperience.trim()) {
      setError("Please fill in job description, skills, and experience.");
      return;
    }

    setError("");
    setCopied(false);
    setIsLoading(true);
    setShowResults(false);

    try {
      const payload = {
        jobDescription: jobDescription.trim(),
        userSkills: userSkills.trim(),
        userExperience: userExperience.trim(),
      };

      const [matchRes, proposalRes] = await Promise.all([
        fetchWithTimeout(
          "/api/match-score",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          FETCH_TIMEOUT_MS,
        ),
        fetchWithTimeout(
          "/api/generate-proposal",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobDescription: payload.jobDescription,
              voiceProfile: `Skills: ${payload.userSkills}. Experience: ${payload.userExperience}.`,
            }),
          },
          FETCH_TIMEOUT_MS,
        ),
      ]);

      const matchJson = (await matchRes.json()) as MatchScoreResponse & { error?: string };
      const proposalJson = (await proposalRes.json()) as ProposalResponse & { error?: string };

      if (!matchRes.ok) {
        throw new Error(matchJson.error || "Failed to analyze match score.");
      }

      if (!proposalRes.ok) {
        throw new Error(proposalJson.error || "Failed to generate proposal.");
      }

      setMatchData(matchJson);
      setProposalData(proposalJson);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Request timed out after 120 seconds. Please try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong.";
      setError(message);
      setMatchData(null);
      setProposalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyProposal = async () => {
    if (!proposalData?.proposal) return;
    try {
      await navigator.clipboard.writeText(proposalData.proposal);
      setCopied(true);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-xl sm:p-7">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Proposal Generator
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Analyze your fit, then generate a targeted freelance proposal.
          </p>

          <div className="mt-6 space-y-4">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job post here..."
              className="h-44 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />

            <input
              type="text"
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
              placeholder="e.g. React, Node.js, Python"
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />

            <input
              type="text"
              value={userExperience}
              onChange={(e) => setUserExperience(e.target.value)}
              placeholder="e.g. 3 years web development"
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />

            <button
              type="button"
              onClick={submit}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                    {LOADING_MESSAGES[loadingMessageIndex]}
                </span>
              ) : (
                "Analyze & Generate"
              )}
            </button>
            {isLoading && (
              <p className="text-center text-xs text-gray-400">
                This may take up to 60 seconds on free tier
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {matchData && proposalData && (
          <div
            className={`mt-6 space-y-6 transition-all duration-500 ${
              showResults ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <section className="rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-xl sm:p-7">
              <h2 className="text-xl font-semibold">Match Score</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={`text-5xl font-bold sm:text-6xl ${scoreColorClass(matchData.score)}`}>
                    {matchData.score}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">out of 100</p>
                </div>
                <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-medium text-gray-200">
                  {matchData.verdict}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-emerald-300">Strengths</h3>
                  <ul className="space-y-2 text-sm text-gray-200">
                    {matchData.strengths.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-2">
                        <span className="mt-0.5 text-emerald-400">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-red-300">Gaps</h3>
                  <ul className="space-y-2 text-sm text-gray-200">
                    {matchData.gaps.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start gap-2">
                        <span className="mt-0.5 text-red-400">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                <span className="font-medium">Improvement tip: </span>
                {matchData.improvement_tip}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#171717] p-5 shadow-xl sm:p-7">
              <h2 className="text-xl font-semibold">Generated Proposal</h2>

              <div className="mt-4 rounded-xl border border-yellow-300/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
                <span className="font-medium">Client pain point: </span>
                {proposalData.clientPainPoint}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {proposalData.keySignals.map((signal, idx) => (
                  <span
                    key={`${signal}-${idx}`}
                    className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200"
                  >
                    {signal}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-[#121212] px-4 py-4 text-sm leading-relaxed text-gray-200 sm:text-[15px]">
                {proposalData.proposal}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={copyProposal}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-white/10"
                >
                  Copy Proposal
                </button>
                {copied && <span className="text-sm text-emerald-300">Copied!</span>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
