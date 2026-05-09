"use client";

import { useState } from "react";
import ProposalGenerator from "./ProposalGenerator";
import JobURLAgent from "./JobURLAgent";

interface HeadAgentResponse {
  intent: 'PROPOSAL' | 'JOB_URL' | 'CV' | 'COVER_LETTER' | 'FOLLOW_UP' | 'UNKNOWN';
  confidence: number;
  reason: string;
  extractedData: {
    url: string | null;
    jobTitle: string | null;
    skills: string | null;
  };
}

export default function HeadAgent() {
  const [userInput, setUserInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<'description' | 'url'>('description');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HeadAgentResponse | null>(null);
  const [showProposalGenerator, setShowProposalGenerator] = useState(false);
  const [prefilledJobDescription, setPrefilledJobDescription] = useState("");
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [extractedUrl, setExtractedUrl] = useState<string>("");

  const handleAnalyzeDescription = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/head-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const data: HeadAgentResponse = await response.json();
      setResult(data);

      // For direct description input, always go to proposal generator
      setPrefilledJobDescription(userInput);
      setShowProposalGenerator(true);
    } catch (error) {
      console.error('Head Agent error:', error);
      setResult({
        intent: 'UNKNOWN',
        confidence: 0,
        reason: 'Error processing request',
        extractedData: { url: null, jobTitle: null, skills: null }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractURL = () => {
    if (!urlInput.trim()) return;
    setCurrentAgent('job_url');
    setExtractedUrl(urlInput.trim());
  };

  
  // If we should show JobURLAgent
  if (currentAgent === 'job_url') {
    return (
      <JobURLAgent 
        initialUrl={extractedUrl}
        onBack={() => {
          setCurrentAgent(null);
          setExtractedUrl('');
          setResult(null);
        }}
      />
    );
  }

  // If we should show ProposalGenerator
  if (showProposalGenerator && result?.intent === 'PROPOSAL') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => {
              setShowProposalGenerator(false);
              setResult(null);
              setCurrentAgent(null);
            }}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2"
          >
            ← Back to Head Agent
          </button>
        </div>
        <ProposalGenerator isGuest={true} user={null} initialJobDescription={prefilledJobDescription} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-8">
        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'description'
                ? 'text-white border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            📋 Paste Job Description
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'url'
                ? 'text-white border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            🔗 Paste Job URL
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'description' ? (
          <div className="space-y-4">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleAnalyzeDescription();
                }
              }}
              placeholder="Paste the full job description here..."
              className="w-full min-h-[200px] p-4 bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
              rows={8}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-400">Press Ctrl+Enter to generate</p>
            <button
              onClick={handleAnalyzeDescription}
              disabled={isLoading || !userInput.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-cyan-900 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-cyan-900 border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze & Generate Proposal →
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExtractURL();
                }
              }}
              placeholder="Paste Upwork, Fiverr, or LinkedIn URL..."
              className="w-full p-4 bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleExtractURL}
              disabled={isLoading || !urlInput.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-cyan-900 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-cyan-900 border-t-transparent rounded-full animate-spin"></div>
                  Extracting...
                </>
              ) : (
                <>
                  Extract Job Details →
                </>
              )}
            </button>
            <p className="text-sm text-gray-400 text-center">
              Supports: Upwork • Fiverr • LinkedIn • Freelancer.com
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
