"use client";

import { useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import type { VoiceProfile } from "@/lib/voiceFingerprint";

interface OnboardingModalProps {
  user: User;
  onComplete: () => void;
}

const STEPS = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "Your Voice" },
  { number: 3, label: "Done" },
];

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [samples, setSamples] = useState(["", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedTraits, setDetectedTraits] = useState<string[]>([]);
  const supabase = getSupabaseBrowserClient();

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";
  const avatarUrl = user.user_metadata?.avatar_url;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    // Save empty samples and complete with default profile
    completeOnboarding([]);
  };

  const handleAnalyze = async () => {
    const validSamples = samples.filter((s) => s.trim().length > 0);

    setIsAnalyzing(true);

    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate placeholder traits based on samples (or default if none)
    const traits =
      validSamples.length > 0
        ? ["Tone: Professional & Direct", "Style: Concise sentences", "Opening: Problem-first"]
        : ["Tone: Professional and helpful", "Style: Balanced approach", "Opening: Pain-first"];

    setDetectedTraits(traits);
    setIsAnalyzing(false);
    setStep(3);

    // Save samples to database
    if (validSamples.length > 0) {
      for (let i = 0; i < validSamples.length; i++) {
        await supabase.from("onboarding_samples").insert({
          user_id: user.id,
          sample_text: validSamples[i],
          sample_number: i + 1,
        });
      }
    }

    // Analyze and save voice profile
    const { analyzeVoice } = await import("@/lib/voiceFingerprint");
    const voiceProfile = analyzeVoice(validSamples);

    // Complete onboarding
    await completeOnboarding(validSamples, voiceProfile);
  };

  const completeOnboarding = async (validSamples: string[], voiceProfile?: VoiceProfile) => {
    const { analyzeVoice } = await import("@/lib/voiceFingerprint");
    const profile = voiceProfile || analyzeVoice(validSamples);

    await supabase
      .from("user_profiles")
      .update({
        onboarding_completed: true,
        voice_profile: profile,
        email: user.email,
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      })
      .eq("id", user.id);

    onComplete();
  };

  const updateSample = (index: number, value: string) => {
    const newSamples = [...samples];
    newSamples[index] = value;
    setSamples(newSamples);
  };

  const canAnalyze = samples[0].trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-[560px] rounded-2xl border border-white/15 bg-[#171717] p-6 shadow-2xl">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors ${
                  s.number === step
                    ? "bg-cyan-400"
                    : s.number < step
                      ? "bg-cyan-400/50"
                      : "bg-white/20"
                }`}
              />
              {s.number < STEPS.length && (
                <div
                  className={`h-px w-6 ${
                    s.number < step ? "bg-cyan-400/50" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-400">
            Step {step} of 3
          </span>
        </div>

        {/* Step 1 - Welcome */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">
              Welcome to ProposalOS! 👋
            </h2>
            <p className="mt-4 text-sm text-gray-300">
              Let&apos;s set up your profile so AI can write proposals in YOUR exact voice
            </p>

            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={userName}
                width={80}
                height={80}
                className="mx-auto mt-6 h-20 w-20 rounded-full border-2 border-cyan-400/30"
              />
            )}
            <p className="mt-4 text-lg font-medium text-cyan-200">Hey {userName}!</p>

            <button
              type="button"
              onClick={handleNext}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-base font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              Let&apos;s Start →
            </button>
          </div>
        )}

        {/* Step 2 - Paste Samples */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-white">
              Paste 1-3 of your past proposals
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              No past proposals? No problem — skip this step and AI will learn as you go
            </p>

            <div className="mt-6 space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index}>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Sample {index + 1} {index === 0 ? "(Required)" : "(Optional)"}
                  </label>
                  <textarea
                    value={samples[index]}
                    onChange={(e) => updateSample(index, e.target.value)}
                    placeholder="Paste your proposal here..."
                    rows={6}
                    className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              These are used ONLY to learn your writing style. Never stored publicly.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Analyze My Style →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Done */}
        {step === 3 && (
          <div className="text-center">
            {isAnalyzing ? (
              <>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                <p className="mt-4 text-sm text-gray-300">
                  Analyzing your writing style...
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-white">
                  Your voice profile is ready! ✨
                </h2>

                <div className="mt-6 space-y-3">
                  {detectedTraits.map((trait, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200"
                    >
                      {trait}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onComplete()}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-base font-semibold text-slate-900 transition hover:bg-cyan-400"
                >
                  Start Writing Proposals →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
