"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

interface Proposal {
  id: string;
  job_description: string;
  match_score: number;
  match_verdict: string;
  proposal_text: string;
  created_at: string;
}

interface ProposalHistoryProps {
  user: User;
}

export default function ProposalHistory({ user }: ProposalHistoryProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("id, job_description, match_score, match_verdict, proposal_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setProposals(data);
    }
    setIsLoading(false);
  }, [user.id, supabase]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    return "bg-red-500/20 text-red-400 border-red-500/40";
  };

  const copyProposal = async (proposal: Proposal) => {
    try {
      await navigator.clipboard.writeText(proposal.proposal_text);
      setCopiedId(proposal.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl font-semibold text-white">Your Recent Proposals</h3>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-white/10 bg-[#171717]/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-xl font-semibold text-white">Your Recent Proposals</h3>
        <div className="mt-4 rounded-xl border border-white/10 bg-[#171717] p-8 text-center">
          <p className="text-gray-400">No proposals yet. Generate your first one above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      <h3 className="text-xl font-semibold text-white">Your Recent Proposals</h3>
      <div className="mt-4 space-y-3">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="rounded-xl border border-white/10 bg-[#171717] p-4 transition hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {formatDate(proposal.created_at)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getScoreColor(
                      proposal.match_score
                    )}`}
                  >
                    {proposal.match_score} - {proposal.match_verdict}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-300">
                  {expandedId === proposal.id
                    ? proposal.proposal_text
                    : truncateText(proposal.proposal_text, 100)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => copyProposal(proposal)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10"
                >
                  {copiedId === proposal.id ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expandedId === proposal.id ? null : proposal.id)
                  }
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/10"
                >
                  {expandedId === proposal.id ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
