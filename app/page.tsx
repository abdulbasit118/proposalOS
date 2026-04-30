 "use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthButton from "@/components/AuthButton";
import ProposalGenerator from "@/components/ProposalGenerator";
import ProposalHistory from "@/components/ProposalHistory";
import OnboardingModal from "@/components/OnboardingModal";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type ExampleProposal = {
  job: string;
  score: string;
  verdict: "Strong Match" | "Good Match";
  proposal: string;
};

const EXAMPLES: ExampleProposal[] = [
  {
    job: "React Developer Dashboard",
    score: "88",
    verdict: "Strong Match",
    proposal:
      "Your dashboard needs to handle real-time data without slowing down — I have built exactly that. Over 3 years I delivered 12 React dashboards with TypeScript and Tailwind, all with live chart updates and JWT auth. I can start Monday and deliver within 2 weeks inside your $500-800 budget. Want to see two similar projects before we begin?",
  },
  {
    job: "Content Writer for SaaS Blog",
    score: "75",
    verdict: "Good Match",
    proposal:
      "SaaS blogs fail when they sound like documentation. I write content that converts — 3 years writing for B2B SaaS companies, averaging 2,400 words per article with measurable traffic growth. I can deliver your first article within 5 days. Shall I send a relevant writing sample first?",
  },
  {
    job: "Graphic Designer for Brand Identity",
    score: "82",
    verdict: "Strong Match",
    proposal:
      "A brand identity that looks generic costs more than it saves. I have designed full brand systems for 8 startups — logo, colors, typography, and usage guidelines. Turnaround is 7 days with 3 revision rounds included. Can I show you two brand packages from similar industries?",
  },
];

export default function Home() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if guest mode should persist on refresh
  useEffect(() => {
    // Check if user was in guest mode before
    const wasGuestMode = localStorage.getItem("wasGuestMode") === "true";
    // Also check if guestProposalCount exists (even if "0")
    const guestCountStr = localStorage.getItem("guestProposalCount");
    const hasGuestCount = guestCountStr !== null;

    if (wasGuestMode || hasGuestCount) {
      setGuestMode(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (mounted) setUser(currentUser);

      // Check if onboarding is needed
      if (currentUser) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", currentUser.id)
          .single();

        if (!profile || profile.onboarding_completed === false) {
          setShowOnboarding(true);
        }
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        setShowSignInModal(false);
        // Check onboarding for new sign-ins
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", newUser.id)
          .single();

        if (!profile || profile.onboarding_completed === false) {
          setShowOnboarding(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!copiedExample) return;
    const timer = window.setTimeout(() => setCopiedExample(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedExample]);

  useEffect(() => {
    if (showExamplesModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showExamplesModal]);

  const handleTryFreeNow = () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    const element = document.getElementById("generator");
    if (element) {
      const top = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top,
        behavior: "smooth",
      });
    }
  };

  const handleSignIn = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const copyExample = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedExample(key);
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">ProposalOS</p>
        <div className="flex items-center gap-3">
          {guestMode && !user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Guest Mode</span>
              <button
                type="button"
                onClick={handleSignIn}
                className="rounded-md border border-white/20 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"
              >
                Sign In
              </button>
            </div>
          )}
          <AuthButton />
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#171717] p-8 shadow-xl sm:p-12">
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            Stop Sending Generic Proposals. Start Winning Clients.
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-gray-300 sm:text-lg">
            AI analyzes every job post and writes a proposal in your exact voice. Match score
            shows you which jobs to apply for first.
          </p>

          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleTryFreeNow}
              className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 sm:w-auto"
            >
              Try Free Now
            </button>
            <button
              type="button"
              onClick={() => setShowExamplesModal(true)}
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-100 transition hover:bg-white/10 sm:w-auto"
            >
              See Examples
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("wasGuestMode", "true");
                setGuestMode(true);
                const element = document.getElementById("generator");
                if (element) {
                  const top = element.getBoundingClientRect().top + window.pageYOffset - 80;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
              className="inline-flex w-full flex-col items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              <span>Try as Guest</span>
              <span className="text-xs font-normal text-gray-400">3 free proposals • No signup needed</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#151515] p-4 text-center sm:grid-cols-3 sm:p-5">
          <div className="rounded-lg bg-white/5 px-4 py-4 text-sm font-semibold text-cyan-200">
            10x Faster
          </div>
          <div className="rounded-lg bg-white/5 px-4 py-4 text-sm font-semibold text-cyan-200">
            85% Match Accuracy
          </div>
          <div className="rounded-lg bg-white/5 px-4 py-4 text-sm font-semibold text-cyan-200">
            100% Free to Start
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold sm:text-3xl">How It Works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            "Paste Job Post",
            "Get Match Score",
            "Copy Your Proposal",
          ].map((step, index) => (
            <div
              key={step}
              className="rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg transition hover:border-cyan-400/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Step {index + 1}
              </p>
              <p className="mt-2 text-lg font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold sm:text-3xl">Features</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {/* Feature 1 - Smart Match Score */}
          <div className="rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-cyan-200">Smart Match Score</h3>
            <p className="mt-2 text-sm text-gray-300">
              AI analyzes job requirements against your skills and gives a 0-100 match score
            </p>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedFeatures["match-score"] ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="mt-3 text-sm text-gray-400">
                Know before you apply. The match score breaks down your strengths, identifies skill gaps, and gives you one specific tip to improve your chances. Stop wasting proposals on jobs you won&apos;t get.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setExpandedFeatures((prev) => ({
                  ...prev,
                  "match-score": !prev["match-score"],
                }))
              }
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              {expandedFeatures["match-score"] ? (
                <>
                  Show less <span className="text-xs">↑</span>
                </>
              ) : (
                <>
                  Read more <span className="text-xs">↓</span>
                </>
              )}
            </button>
          </div>

          {/* Feature 2 - Voice-Matched Writing */}
          <div className="rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-cyan-200">Voice-Matched Writing</h3>
            <p className="mt-2 text-sm text-gray-300">
              Proposals written in your exact tone and style, not generic AI text
            </p>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedFeatures["voice-matched"] ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="mt-3 text-sm text-gray-400">
                Every freelancer has a unique voice. ProposalOS learns your sentence length, formality level, and opening patterns from your past work. Result: proposals that sound exactly like you wrote them — because the AI learned from you.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setExpandedFeatures((prev) => ({
                  ...prev,
                  "voice-matched": !prev["voice-matched"],
                }))
              }
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              {expandedFeatures["voice-matched"] ? (
                <>
                  Show less <span className="text-xs">↑</span>
                </>
              ) : (
                <>
                  Read more <span className="text-xs">↓</span>
                </>
              )}
            </button>
          </div>

          {/* Feature 3 - Pain Point Detection */}
          <div className="rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-cyan-200">Pain Point Detection</h3>
            <p className="mt-2 text-sm text-gray-300">
              Finds what the client actually wants before writing a single word
            </p>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedFeatures["pain-point"] ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="mt-3 text-sm text-gray-400">
                Clients rarely say what they really need. Our AI reads between the lines — finds the hidden frustration, the real deadline pressure, the unstated requirement. Then opens your proposal by addressing that pain directly. This is why our proposals get replies when others don&apos;t.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setExpandedFeatures((prev) => ({
                  ...prev,
                  "pain-point": !prev["pain-point"],
                }))
              }
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              {expandedFeatures["pain-point"] ? (
                <>
                  Show less <span className="text-xs">↑</span>
                </>
              ) : (
                <>
                  Read more <span className="text-xs">↓</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section id="generator" className="mt-10 pb-10">
        {user || guestMode ? (
          <>
            <ProposalGenerator isGuest={guestMode && !user} user={user} />
            {user && !guestMode && <ProposalHistory user={user} />}
          </>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-5 text-center text-sm text-cyan-100">
              <p className="mb-4">Sign in with Google or try Guest Mode to generate your first proposal</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                >
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("wasGuestMode", "true");
                    setGuestMode(true);
                    const element = document.getElementById("generator");
                    if (element) {
                      const top = element.getBoundingClientRect().top + window.pageYOffset - 80;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:bg-white/10"
                >
                  Try as Guest
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto mb-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold sm:text-3xl">Pricing</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {/* Free Plan - Active */}
          <div className="rounded-xl border border-white/10 bg-[#171717] p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Free</h3>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                Current Plan
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> 3 proposals per day
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Match score analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Guest mode (3 tries)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Google sign in required
              </li>
            </ul>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById("generator");
                if (element) {
                  const top = element.getBoundingClientRect().top + window.pageYOffset - 80;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan - Coming Soon */}
          <div className="rounded-xl border border-white/10 bg-[#171717] p-6 shadow-lg opacity-40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-200">Pro $19/mo</h3>
              <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400">
                Coming Soon
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✓</span> Unlimited proposals
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✓</span> Full proposal history
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✓</span> Advanced analytics
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-300"
            >
              Coming Soon
            </button>
          </div>

          {/* Agency Plan - Coming Soon */}
          <div className="rounded-xl border border-white/10 bg-[#171717] p-6 shadow-lg opacity-40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-200">Agency $49/mo</h3>
              <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400">
                Coming Soon
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✓</span> 5 team members
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✓</span> Team analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-500">✓</span> Shared templates
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-300"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-400">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <span>ProposalOS © 2026</span>
          <a
            href="https://forms.gle/GTkp4vDfEt7K1njo7"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-gray-100"
          >
            <span className="text-base leading-none">💬</span>
            Give Feedback
          </a>
        </div>
      </footer>

      {showExamplesModal && (
        <div className="fixed inset-0 z-[9999] flex bg-[rgba(0,0,0,0.8)] px-3 py-4 sm:px-6 sm:py-6">
          <div className="modal-fade-in m-auto max-h-[90vh] w-[90%] max-w-[600px] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#131313] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#131313] px-5 py-4">
              <h3 className="text-lg font-semibold sm:text-xl">Example Proposals</h3>
              <button
                type="button"
                onClick={() => setShowExamplesModal(false)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-1">
              {EXAMPLES.map((item, index) => (
                <div key={item.job} className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
                  <p className="text-sm font-medium text-cyan-200">{item.job}</p>
                  <span className="mt-2 inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">
                    Match Score: {item.score} - {item.verdict}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-gray-200">{item.proposal}</p>
                  <button
                    type="button"
                    onClick={() => copyExample(item.proposal, `${item.job}-${index}`)}
                    className="mt-4 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-white/10"
                  >
                    {copiedExample === `${item.job}-${index}` ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {showSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="modal-fade-in w-full max-w-md rounded-2xl border border-white/15 bg-[#131313] p-6 text-center shadow-2xl">
            <h3 className="text-2xl font-semibold">Sign in to Get Started</h3>
            <p className="mt-3 text-sm text-gray-300">
              Create your free account to generate AI-powered proposals
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-base font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={() => setShowSignInModal(false)}
              className="mt-3 rounded-md border border-white/20 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
