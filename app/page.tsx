 "use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthButton from "@/components/AuthButton";
import ProposalGenerator from "@/components/ProposalGenerator";
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

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (mounted) setUser(currentUser);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowSignInModal(false);
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
        <AuthButton />
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

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleTryFreeNow}
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              Try Free Now
            </button>
            <button
              type="button"
              onClick={() => setShowExamplesModal(true)}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-100 transition hover:bg-white/10"
            >
              See Examples
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
          {[
            {
              title: "Smart Match Score",
              desc: "Know in seconds whether a job is worth your time before you write anything.",
            },
            {
              title: "Voice-Matched Writing",
              desc: "Proposals mirror your writing style so every pitch sounds like you, not a template.",
            },
            {
              title: "Pain Point Detection",
              desc: "Highlights client urgency, budget signals, and core problems to address up front.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-cyan-200">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="generator" className="mt-10 pb-10">
        {user ? (
          <ProposalGenerator />
        ) : (
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-5 text-center text-sm text-cyan-100">
              Please sign in with Google to generate proposals and match scores.
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto mb-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold sm:text-3xl">Pricing</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#171717] p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-2 text-sm text-gray-300">5 proposals/day</p>
          </div>
          <div className="rounded-xl border border-cyan-400/30 bg-[#171717] p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-cyan-200">Pro $19/mo</h3>
            <p className="mt-2 text-sm text-gray-300">unlimited proposals + history</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#171717] p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Agency $49/mo</h3>
            <p className="mt-2 text-sm text-gray-300">5 team members + analytics</p>
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
