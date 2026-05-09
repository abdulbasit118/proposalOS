"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProposalGenerator from "./ProposalGenerator";

interface JobData {
  title: string;
  platform: 'Upwork' | 'Fiverr' | 'LinkedIn' | 'Freelancer' | 'Other';
  budget: string | null;
  duration: string | null;
  skills: string[];
  description: string;
  clientRequirements: string[];
  experienceLevel: 'Entry' | 'Intermediate' | 'Expert' | null;
  proposals: string | null;
  postedTime: string | null;
  clientLocation: string | null;
  paymentVerified: boolean | null;
}

interface JobURLAgentProps {
  initialUrl?: string;
  onBack?: () => void;
  onJobExtracted?: (description: string, skills: string) => void;
}

const LOADING_MESSAGES = [
  "Fetching job post...",
  "Reading job details...",
  "Extracting requirements...",
  "Almost ready..."
];

export default function JobURLAgent({ initialUrl = "", onBack, onJobExtracted }: JobURLAgentProps) {
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProposalGenerator, setShowProposalGenerator] = useState(false);

  const handleExtract = useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setJobData(null);

    try {
      const response = await fetch('/api/job-url-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract job details');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setJobData(result.data);
      } else {
        throw new Error('No job data received');
      }
    } catch (error) {
      console.error('Job extraction error:', error);
      setError(error instanceof Error ? error.message : 'Failed to extract job details');
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const handleGenerateProposal = () => {
    if (jobData?.description) {
      if (onJobExtracted) {
        onJobExtracted(
          jobData.description,
          jobData.skills.join(', ')
        )
      } else {
        setShowProposalGenerator(true)
      }
    }
  };

  const handleStartOver = () => {
    setUrl(initialUrl);
    setJobData(null);
    setError(null);
    setShowProposalGenerator(false);
  };

  const handlePasteJobDescription = () => {
    if (onBack) {
      onBack();
    }
  };

  // Auto-extract if initialUrl is provided
  useEffect(() => {
    if (initialUrl && !jobData && !error) {
      handleExtract();
    }
  }, [initialUrl, jobData, error, handleExtract]);

  // Rotate loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 mb-4"
          >
            ← Back to Head Agent
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">
            Extract Job Details from URL
          </h2>
        </div>

        {/* Input Section */}
        {!jobData && !isLoading && (
          <>
            <div className="space-y-4">
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Upwork, Fiverr, or LinkedIn job URL here..."
                className="w-full min-h-[120px] p-4 bg-[#0f0f0f] border border-white/10 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
                rows={4}
              />
              
              <button
                onClick={handleExtract}
                disabled={!url.trim() || isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-cyan-900 font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Extract Job Details →
              </button>

              <p className="text-sm text-gray-400 text-center">
                Supports: Upwork • Fiverr • LinkedIn • Freelancer.com
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="mt-6 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Could not extract job details
                </h3>
                <p className="text-gray-300 mb-4">
                  This URL may require login or is not publicly accessible.
                  Try copying the job description and pasting it directly.
                </p>
                <button
                  onClick={handlePasteJobDescription}
                  className="bg-cyan-500 hover:bg-cyan-400 text-cyan-900 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Paste Job Description Instead
                </button>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl text-cyan-400 font-medium">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
          </div>
        )}

        {/* Results Section */}
        {jobData && !isLoading && (
          <div className="space-y-6 animate-fade-in">
            {/* Card 1 - Job Overview */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Job Overview</h3>
              
              <div className="space-y-3">
                <div className="text-2xl font-bold text-cyan-400">{jobData.title}</div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm">
                    {jobData.platform}
                  </span>
                  {jobData.budget && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm">
                      {jobData.budget}
                    </span>
                  )}
                  {jobData.experienceLevel && (
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm">
                      {jobData.experienceLevel}
                    </span>
                  )}
                  {jobData.paymentVerified !== null && (
                    <span className={`px-3 py-1 border rounded-full text-sm ${
                      jobData.paymentVerified 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      Payment {jobData.paymentVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {jobData.duration && (
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white ml-2">{jobData.duration}</span>
                    </div>
                  )}
                  {jobData.postedTime && (
                    <div>
                      <span className="text-gray-400">Posted:</span>
                      <span className="text-white ml-2">{jobData.postedTime}</span>
                    </div>
                  )}
                  {jobData.clientLocation && (
                    <div>
                      <span className="text-gray-400">Client Location:</span>
                      <span className="text-white ml-2">{jobData.clientLocation}</span>
                    </div>
                  )}
                  {jobData.proposals && (
                    <div>
                      <span className="text-gray-400">Proposals:</span>
                      <span className="text-white ml-2">{jobData.proposals}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2 - Required Skills */}
            {jobData.skills.length > 0 && (
              <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ✏️ You can edit these skills or add 
                  your own before generating a proposal
                </p>
              </div>
            )}

            {/* Card 3 - Job Description */}
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Job Description</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(jobData.description)}
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  Copy
                </button>
              </div>
              <div className="max-h-[200px] overflow-y-auto text-gray-300 whitespace-pre-wrap">
                {jobData.description}
              </div>
            </div>

            {/* Card 4 - Client Requirements */}
            {jobData.clientRequirements.length > 0 && (
              <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Client Requirements</h3>
                <ul className="space-y-2">
                  {jobData.clientRequirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleGenerateProposal}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-cyan-900 font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Generate Proposal for This Job →
              </button>
              <button
                onClick={handleStartOver}
                className="px-6 py-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-xl transition-colors"
              >
                Start Over
              </button>
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
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
