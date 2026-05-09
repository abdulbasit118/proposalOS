import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body;

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput is required and must be a string' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a routing agent for ProposalOS — a freelance productivity tool.

Analyze the user input and classify it into exactly one of these intents:

1. PROPOSAL — User wants to write a proposal
   Signals: job description, project details,
   budget mentioned, client requirements,
   Upwork/Fiverr job post text

2. JOB_URL — User pasted a URL
   Signals: starts with http/https,
   contains upwork.com, fiverr.com, 
   freelancer.com, linkedin.com/jobs

3. CV — User wants a CV or resume
   Signals: words like CV, resume, 
   curriculum vitae, job application

4. COVER_LETTER — User wants a cover letter
   Signals: cover letter, application letter,
   applying for job (non-freelance)

5. FOLLOW_UP — User wants to follow up
   Signals: follow up, no response, 
   sent proposal, heard nothing, 
   check in, reminder

6. UNKNOWN — Cannot determine intent

Return ONLY this JSON:
{
  intent: 'PROPOSAL' | 'JOB_URL' | 'CV' | 
          'COVER_LETTER' | 'FOLLOW_UP' | 'UNKNOWN',
  confidence: number between 0-100,
  reason: one sentence why you chose this,
  extractedData: {
    url: string or null (if JOB_URL),
    jobTitle: string or null (if detectable),
    skills: string or null (if mentioned)
  }
}

Return ONLY valid JSON. No other text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to process request with AI service' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI service' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: 'Invalid response format from AI service' },
        { status: 500 }
      );
    }

    // Validate the response structure
    const validIntents = ['PROPOSAL', 'JOB_URL', 'CV', 'COVER_LETTER', 'FOLLOW_UP', 'UNKNOWN'];
    if (!validIntents.includes(result.intent)) {
      return NextResponse.json(
        { error: 'Invalid intent returned from AI service' },
        { status: 500 }
      );
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 100) {
      return NextResponse.json(
        { error: 'Invalid confidence value returned from AI service' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Head Agent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
