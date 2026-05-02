"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-gray-100">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-6 text-4xl font-bold text-white">
            <span className="text-cyan-400">ProposalOS</span> Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-400">Last updated: May 1, 2026</p>
        </div>

        {/* Section 1 — Introduction */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Privacy Matters</h2>
          <p className="text-gray-300 leading-relaxed">
            ProposalOS is built by a solo developer who values your privacy. We collect only what is necessary to make the app work. We never sell your data. We never will.
          </p>
        </div>

        {/* Section 2 — What We Collect */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">What Data We Collect</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="text-2xl">👤</div>
              <div>
                <h3 className="font-medium text-white mb-2">Google Account Info</h3>
                <p className="text-gray-300 text-sm">
                  When you sign in with Google we receive your name, email address, and profile photo. This is used only to identify your account.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">📋</div>
              <div>
                <h3 className="font-medium text-white mb-2">Job Descriptions</h3>
                <p className="text-gray-300 text-sm">
                  The job posts you paste into ProposalOS are sent to our AI to generate your proposal. We store these to show you your proposal history. You can delete them anytime.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">✍️</div>
              <div>
                <h3 className="font-medium text-white mb-2">Writing Samples</h3>
                <p className="text-gray-300 text-sm">
                  If you paste sample proposals during onboarding, we analyze them to learn your writing style. These samples are stored securely and used only to improve your proposals.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">🤖</div>
              <div>
                <h3 className="font-medium text-white mb-2">Generated Proposals</h3>
                <p className="text-gray-300 text-sm">
                  Your generated proposals are saved to your account history so you can access them later. Only you can see your proposals.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-medium text-white mb-2">Usage Data</h3>
                <p className="text-gray-300 text-sm">
                  We track basic usage like how many proposals you generate per day. This is used only for rate limiting and improving the service.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — How We Use Your Data */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">How We Use Your Data</h2>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-medium text-emerald-400 mb-3">We use your data to:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Generate personalized AI proposals for you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Learn and match your writing voice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Show you your proposal history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Enforce fair usage limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Improve the quality of AI outputs</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-red-400 mb-3">We never:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Sell your data to anyone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Share with advertisers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Use your data to train public AI models</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Send you spam emails</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4 — Data Storage & Security */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Where Your Data Lives</h2>
          <p className="text-gray-300 leading-relaxed">
            All data is stored securely in Supabase — a trusted database provider with enterprise grade security. Your data is encrypted at rest and in transit. We use Row Level Security (RLS) which means your data is only accessible by you and never by other users.
          </p>
        </div>

        {/* Section 5 — Third Party Services */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Third Party Services We Use</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#0f0f0f] p-4">
              <h3 className="font-medium text-white mb-2">Google OAuth</h3>
              <p className="text-sm text-gray-400">For sign in only</p>
            </div>
            
            <div className="rounded-lg border border-white/10 bg-[#0f0f0f] p-4">
              <h3 className="font-medium text-white mb-2">Supabase</h3>
              <p className="text-sm text-gray-400">Secure database storage</p>
            </div>
            
            <div className="rounded-lg border border-white/10 bg-[#0f0f0f] p-4">
              <h3 className="font-medium text-white mb-2">Vercel</h3>
              <p className="text-sm text-gray-400">App hosting</p>
            </div>
            
            <div className="rounded-lg border border-white/10 bg-[#0f0f0f] p-4">
              <h3 className="font-medium text-white mb-2">OpenRouter</h3>
              <p className="text-sm text-gray-400">AI model provider</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-gray-400">
            OpenRouter processes your job descriptions to generate proposals. They have their own privacy policy. We do not send your personal information to OpenRouter.
          </p>
        </div>

        {/* Section 6 — Your Rights */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Your Rights</h2>
          
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <strong className="text-white">Access:</strong> You can see all your data in your proposal history
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <strong className="text-white">Delete:</strong> Email us to delete your entire account and all data
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <strong className="text-white">Export:</strong> Email us to get a copy of all your data
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <strong className="text-white">Opt out:</strong> You can stop using the service at any time
              </div>
            </li>
          </ul>
        </div>

        {/* Section 7 — Cookies */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
          <p className="text-gray-300 leading-relaxed">
            We use only one session cookie to keep you logged in. We do not use tracking cookies, advertising cookies, or any third party analytics cookies. No cookie consent banner needed.
          </p>
        </div>

        {/* Section 8 — Contact */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#171717] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Questions or Concerns?</h2>
          <p className="text-gray-300 mb-4">
            If you have any questions about this privacy policy or want to delete your data, contact us:
          </p>
          <p className="text-cyan-400 font-medium">
            abdulrazzaque1234509876@gmail.com
          </p>
          <p className="mt-2 text-sm text-gray-400">
            We respond within 48 hours.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-gray-400 mb-4">© 2026 ProposalOS. All rights reserved.</p>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to ProposalOS
          </Link>
        </div>
      </div>
    </main>
  );
}
