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
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HeadAgentResponse | null>(null);
  const [showProposalGenerator, setShowProposalGenerator] = useState(false);
  const [prefilledJobDescription, setPrefilledJobDescription] = useState("");
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [extractedUrl, setExtractedUrl] = useState<string>("");

  const handleSubmit = async () => {
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

      // Handle routing based on intent
      switch (data.intent) {
        case 'PROPOSAL':
          setPrefilledJobDescription(userInput);
          setShowProposalGenerator(true);
          break;
        case 'JOB_URL':
          setCurrentAgent('job_url');
          setExtractedUrl(data.extractedData?.url || userInput.trim());
          break;
        case 'CV':
        case 'COVER_LETTER':
        case 'FOLLOW_UP':
        case 'UNKNOWN':
          setShowProposalGenerator(false);
          break;
      }
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

  const getIntentMessage = (intent: string) => {
    switch (intent) {
      case 'PROPOSAL':
        return "Detected: Job Proposal ✓";
      case 'JOB_URL':
        return "Detected: Job URL ✓";
      case 'CV':
        return "Detected: CV Request ✓";
      case 'COVER_LETTER':
        return "Detected: Cover Letter ✓";
      case 'FOLLOW_UP':
        return "Detected: Follow-up Request ✓";
      default:
        return "Detected: Unknown ✓";
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'PROPOSAL':
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case 'JOB_URL':
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case 'CV':
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case 'COVER_LETTER':
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case 'FOLLOW_UP':
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusMessage = (intent: string) => {
    switch (intent) {
      case 'PROPOSAL':
        return null; // Will show ProposalGenerator
      case 'JOB_URL':
        return null; // Will show JobURLAgent
      case 'CV':
        return "CV Writer coming soon! For now, paste the job description to generate a proposal.";
      case 'COVER_LETTER':
        return "Cover Letter Agent coming soon! For now, paste the job description to generate a proposal.";
      case 'FOLLOW_UP':
        return "Follow-up Agent coming soon! Paste your original proposal and we will write a follow-up soon.";
      default:
        return "We could not figure out what you need. Try pasting a job description or URL.";
    }
  };

  const handleManualOverride = (intent: string) => {
    setResult({
      intent: intent as HeadAgentResponse['intent'],
      confidence: 100,
      reason: "Manual selection by user",
      extractedData: { url: null, jobTitle: null, skills: null }
    });

    switch (intent) {
      case 'PROPOSAL':
        setPrefilledJobDescription(userInput);
        setShowProposalGenerator(true);
        break;
      case 'JOB_URL':
        setCurrentAgent('job_url');
        setExtractedUrl(userInput.trim());
        break;
      default:
        setShowProposalGenerator(false);
        break;
    }
  };

  // If we should show JobURLAgent
  if (currentAgent === 'job_url') {
    return (
      <JobURLAgent 
        initialUrl={extractedUrl}
        onJobExtracted={(jobDescription) => {
          setCurrentAgent('proposal');
          setPrefilledJobDescription(jobDescription);
          setShowProposalGenerator(true);
        }}
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
        {/* Main Input */}
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Paste a job post, drop a URL, ask for a CV, cover letter, or follow-up message... ProposalOS figures out what you need."
          className="w-full min-h-[200px] p-4 bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
          rows={8}
          disabled={isLoading}
        />

        {/* Hint Text */}
        <p className="mt-3 text-sm text-gray-400">
          Works with: Job Posts • Upwork URLs • CV Requests • Cover Letters • Follow-ups
        </p>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !userInput.trim()}
          className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-cyan-900 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-cyan-900 border-t-transparent rounded-full animate-spin"></div>
              Reading your input...
            </>
          ) : (
            <>
              Let ProposalOS Decide →
            </>
          )}
        </button>

        {/* Result Display */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Intent Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${getIntentColor(result.intent)} animate-fade-in`}>
              {getIntentMessage(result.intent)}
            </div>

            {/* Status Message */}
            {getStatusMessage(result.intent) && (
              <div className="p-4 bg-[#0f0f0f] border border-white/10 rounded-xl">
                <p className="text-gray-300">{getStatusMessage(result.intent)}</p>
              </div>
            )}

            {/* Manual Override */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-3">Not right? Choose manually:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleManualOverride('PROPOSAL')}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                >
                  Write Proposal
                </button>
                <button
                  onClick={() => handleManualOverride('JOB_URL')}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                >
                  Extract URL
                </button>
                <button
                  onClick={() => handleManualOverride('CV')}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                >
                  Write CV
                </button>
                <button
                  onClick={() => handleManualOverride('COVER_LETTER')}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
                >
                  Cover Letter
                </button>
                <button
                  onClick={() => handleManualOverride('FOLLOW_UP')}
                  className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors text-sm"
                >
                  Follow Up
                </button>
              </div>
            </div>
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
