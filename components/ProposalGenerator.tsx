"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import type { VoiceProfile } from "@/lib/voiceFingerprint";

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

type ProposalGeneratorProps = {
  isGuest?: boolean;
  user?: User | null;
};

const GUEST_COUNT_KEY = "guestProposalCount";

export default function ProposalGenerator({ isGuest = false, user = null }: ProposalGeneratorProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [userSkills, setUserSkills] = useState("");
  const [userExperience, setUserExperience] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [matchData, setMatchData] = useState<MatchScoreResponse | null>(null);
  const [proposalData, setProposalData] = useState<ProposalResponse | null>(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Validation errors for each field
  const [jobDescError, setJobDescError] = useState("");
  const [skillsError, setSkillsError] = useState("");
  const [experienceError, setExperienceError] = useState("");

  useEffect(() => {
    if (isGuest) {
      const count = parseInt(localStorage.getItem(GUEST_COUNT_KEY) || "0", 10);
      setGuestCount(count);
    }
  }, [isGuest]);

  // Fetch voice profile for signed-in users
  useEffect(() => {
    if (!user || isGuest) return;

    const loadVoiceProfile = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("voice_profile")
        .eq("id", user.id)
        .single();

      if (data?.voice_profile) {
        setVoiceProfile(data.voice_profile as VoiceProfile);
      }
    };

    loadVoiceProfile();
  }, [user, isGuest]);

  const FEEDBACK_FORM_URL = "https://forms.gle/GTkp4vDfEt7K1njo7";
  const FEEDBACK_SESSION_KEY = "proposalos_feedback_toast_shown";

  const hasShownFeedbackThisSession = () => {
    try {
      return sessionStorage.getItem(FEEDBACK_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  };

  const markFeedbackShownThisSession = () => {
    try {
      sessionStorage.setItem(FEEDBACK_SESSION_KEY, "1");
    } catch {
      // ignore
    }
  };

  const maybeShowFeedbackToast = () => {
    if (showFeedbackToast) return;
    if (hasShownFeedbackThisSession()) return;
    markFeedbackShownThisSession();
    setShowFeedbackToast(true);
  };

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
    if (!showResults) return;

    // Show feedback toast after first successful generation
    maybeShowFeedbackToast();
  }, [showResults]);

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

  const handleGuestSignIn = async () => {
    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const submit = async () => {
    // Clear previous validation errors
    setJobDescError("");
    setSkillsError("");
    setExperienceError("");
    setError(null);

    let hasError = false;

    // Validate each field
    if (!jobDescription.trim()) {
      setJobDescError("Please paste a job post to continue");
      hasError = true;
    }
    if (!userSkills.trim()) {
      setSkillsError("Add your skills so AI can match them");
      hasError = true;
    }
    if (!userExperience.trim()) {
      setExperienceError("Tell us your experience level");
      hasError = true;
    }

    if (hasError) {
      // Focus on the first empty field
      if (!jobDescription.trim()) {
        document.getElementById("jobDescription")?.focus();
      } else if (!userSkills.trim()) {
        document.getElementById("userSkills")?.focus();
      } else if (!userExperience.trim()) {
        document.getElementById("userExperience")?.focus();
      }
      return;
    }

    if (isGuest) {
      const currentCount = parseInt(localStorage.getItem(GUEST_COUNT_KEY) || "0", 10);
      if (currentCount >= 3) {
        setShowGuestLimitModal(true);
        return;
      }
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

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (isGuest) {
        headers["x-guest-mode"] = "true";
      }

      const [matchRes, proposalRes] = await Promise.all([
        fetchWithTimeout(
          "/api/match-score",
          {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          },
          FETCH_TIMEOUT_MS,
        ),
        fetchWithTimeout(
          "/api/generate-proposal",
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              jobDescription: payload.jobDescription,
              voiceProfile: voiceProfile
                ? `Skills: ${payload.userSkills}. Experience: ${payload.userExperience}.\n\nUser voice profile:\n- Sentence length: ${voiceProfile.avgSentenceLength}\n- Formality: ${voiceProfile.formality}\n- Opens with: ${voiceProfile.opener} approach\n- Tone: ${voiceProfile.tone}\n- Their common phrases: ${voiceProfile.keyPhrases.join(", ") || "N/A"}`
                : `Skills: ${payload.userSkills}. Experience: ${payload.userExperience}.`,
            }),
          },
          FETCH_TIMEOUT_MS,
        ),
      ]);

      const matchJson = (await matchRes.json()) as MatchScoreResponse & { error?: string };
      const proposalJson = (await proposalRes.json()) as ProposalResponse & { error?: string };

      if (!matchRes.ok) {
        // Check for rate limit
        if (matchRes.status === 429 || matchJson.error === "rate_limit") {
          setShowRateLimitModal(true);
          throw new Error("rate_limit");
        }
        throw new Error(matchJson.error || "Failed to analyze match score.");
      }

      if (!proposalRes.ok) {
        // Check for rate limit
        if (proposalRes.status === 429 || proposalJson.error === "rate_limit") {
          setShowRateLimitModal(true);
          throw new Error("rate_limit");
        }
        throw new Error(proposalJson.error || "Failed to generate proposal.");
      }

      setMatchData(matchJson);
      setProposalData(proposalJson);

      // Only increment guest count on successful response
      if (isGuest) {
        const newCount = parseInt(localStorage.getItem(GUEST_COUNT_KEY) || "0", 10) + 1;
        localStorage.setItem(GUEST_COUNT_KEY, newCount.toString());
        setGuestCount(newCount);
      }

      // Save to Supabase for signed-in users
      if (user && !isGuest) {
        await supabase.from("proposals").insert({
          user_id: user.id,
          job_description: jobDescription.trim(),
          user_skills: userSkills.trim(),
          user_experience: userExperience.trim(),
          match_score: matchJson.score,
          match_verdict: matchJson.verdict,
          strengths: matchJson.strengths,
          gaps: matchJson.gaps,
          improvement_tip: matchJson.improvement_tip,
          client_pain_point: proposalJson.clientPainPoint,
          key_signals: proposalJson.keySignals,
          proposal_text: proposalJson.proposal,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === "rate_limit") {
        return;
      }
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      setError(isTimeout ? "timeout" : "friendly");
      setMatchData(null);
      setProposalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setMatchData(null);
    setProposalData(null);
    setShowResults(false);
    submit();
  };

  const copyProposal = async () => {
    if (!proposalData?.proposal) return;
    try {
      await navigator.clipboard.writeText(proposalData.proposal);
      setCopied(true);
      maybeShowFeedbackToast();
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
            <div>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  if (jobDescError) setJobDescError("");
                }}
                placeholder="Paste the job post here..."
                className={`h-44 w-full rounded-xl border bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                  jobDescError ? "border-red-500" : "border-white/10"
                }`}
              />
              {jobDescError && (
                <p className="mt-1 text-sm text-red-400">{jobDescError}</p>
              )}
            </div>

            <div>
              <input
                id="userSkills"
                type="text"
                value={userSkills}
                onChange={(e) => {
                  setUserSkills(e.target.value);
                  if (skillsError) setSkillsError("");
                }}
                placeholder="e.g. React, Node.js, Python"
                className={`w-full rounded-xl border bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                  skillsError ? "border-red-500" : "border-white/10"
                }`}
              />
              {skillsError && (
                <p className="mt-1 text-sm text-red-400">{skillsError}</p>
              )}
            </div>

            <div>
              <input
                id="userExperience"
                type="text"
                value={userExperience}
                onChange={(e) => {
                  setUserExperience(e.target.value);
                  if (experienceError) setExperienceError("");
                }}
                placeholder="e.g. 3 years web development"
                className={`w-full rounded-xl border bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                  experienceError ? "border-red-500" : "border-white/10"
                }`}
              />
              {experienceError && (
                <p className="mt-1 text-sm text-red-400">{experienceError}</p>
              )}
            </div>

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
            {isGuest && (
              <p className={`text-center text-xs ${
                guestCount === 0 ? "text-emerald-400" :
                guestCount === 1 ? "text-emerald-400" :
                guestCount === 2 ? "text-yellow-400" :
                "text-red-400"
              }`}>
                Guest mode: {guestCount}/3 free proposals used
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-6 py-5 text-center">
              <div className="text-2xl">⚠️</div>
              <h3 className="mt-2 text-lg font-semibold text-yellow-100">
                {error === "timeout" ? "AI is taking too long" : "Something went wrong"}
              </h3>
              <p className="mt-1 text-sm text-yellow-200">
                {error === "timeout" ? "AI is taking too long. Please try again!" : "Our AI is taking a break. Please try again!"}
              </p>
              <button
                type="button"
                onClick={handleTryAgain}
                disabled={isLoading}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                    Retrying...
                  </span>
                ) : (
                  "Try Again"
                )}
              </button>
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

      {showGuestLimitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4">
          <div className="modal-fade-in w-full max-w-md rounded-2xl border border-white/15 bg-[#131313] p-6 text-center shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowGuestLimitModal(false)}
              className="absolute top-4 right-4 rounded-md border border-white/20 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"
            >
              Close
            </button>
            <h3 className="text-xl font-semibold mt-2">You&apos;ve used all 3 free proposals!</h3>
            <p className="mt-3 text-sm text-gray-300">
              Sign in with Google to get unlimited proposals for free
            </p>
            <button
              type="button"
              onClick={handleGuestSignIn}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-base font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              Sign in with Google
            </button>
            <p className="mt-3 text-xs text-gray-400">
              100% free • No credit card
            </p>
          </div>
        </div>
      )}

      {showRateLimitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4">
          <div className="modal-fade-in w-full max-w-md rounded-2xl border border-white/15 bg-[#131313] p-6 text-center shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowRateLimitModal(false)}
              className="absolute top-4 right-4 rounded-md border border-white/20 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"
            >
              Close
            </button>
            <div className="text-4xl mb-4">🌙</div>
            <h3 className="text-xl font-semibold">Daily limit reached</h3>
            <p className="mt-3 text-sm text-gray-300">
              You have used all 3 free proposals today. Come back tomorrow for 3 more — or upgrade to Pro for unlimited proposals.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowRateLimitModal(false);
                // Show coming soon toast
                alert("Pro plan coming soon!");
              }}
              disabled
              className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-600 px-5 py-3 text-base font-semibold text-gray-300"
            >
              Upgrade to Pro — Coming Soon
            </button>
          </div>
        </div>
      )}

      {showFeedbackToast && (
        <div className="fixed bottom-5 right-5 z-[9998] w-full max-w-[320px] modal-fade-in">
          <div className="rounded-2xl border border-white/10 bg-[#131313] p-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-gray-100">
              Enjoying ProposalOS? 🎉
            </h3>
            <p className="mt-2 text-xs text-gray-300">
              Takes 2 minutes — help us improve!
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer")}
                className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-cyan-400"
              >
                Give Feedback
              </button>
              <button
                type="button"
                onClick={() => setShowFeedbackToast(false)}
                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
