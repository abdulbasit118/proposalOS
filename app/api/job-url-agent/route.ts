import { NextRequest, NextResponse } from 'next/server';

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Handle LinkedIn specifically
    if (url.includes('linkedin.com')) {
      return NextResponse.json({
        error: 'linkedin_login_required',
        message: 'LinkedIn requires login to view jobs. Please copy the job description and paste it directly.',
        suggestion: 'paste_description'
      }, { status: 400 });
    }

    let content = '';
    let serpApiContent = '';

    // STEP 1: Try SerpAPI to fetch page content
    try {
      if (!process.env.SERPAPI_KEY) {
        throw new Error('SerpAPI key not configured');
      }

      const serpApiUrl = `https://serpapi.com/search.json?engine=google&q=site:${encodeURIComponent(url)}&api_key=${process.env.SERPAPI_KEY}`;
      const serpApiResponse = await fetch(serpApiUrl);
      
      if (serpApiResponse.ok) {
        const serpData = await serpApiResponse.json();
        serpApiContent = JSON.stringify(serpData);
      }
    } catch (error) {
      console.error('SerpAPI fetch failed:', error);
    }

    // STEP 2: Try direct fetch of the URL
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (pageResponse.ok) {
        const rawContent = await pageResponse.text();
        content = stripHtml(rawContent).slice(0, 3000);
      }
    } catch (error) {
      console.error('Direct fetch failed:', error);
    }

    // If we couldn't get any content, return error
    if (!content && !serpApiContent) {
      return NextResponse.json(
        { error: 'Unable to fetch content from the provided URL' },
        { status: 400 }
      );
    }

    // STEP 3: Send content to OpenRouter AI for extraction
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
      }

      const combinedContent = `
Direct URL Content:
${content}

SerpAPI Results:
${serpApiContent}
      `.trim();

      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b:free',
          messages: [
            {
              role: 'system',
              content: `You are a job post extraction specialist.
Extract structured data from this job posting.

Return ONLY this JSON:
{
  title: string,
  platform: 'Upwork' | 'Fiverr' | 'LinkedIn' | 
            'Freelancer' | 'Other',
  budget: string or null,
  duration: string or null,
  skills: string[],
  description: string (full job description),
  clientRequirements: string[],
  experienceLevel: 'Entry' | 'Intermediate' | 
                   'Expert' | null,
  proposals: string or null (number of proposals),
  postedTime: string or null,
  clientLocation: string or null,
  paymentVerified: boolean or null
}

If you cannot find certain fields, use null.
Return ONLY valid JSON.`
            },
            {
              role: 'user',
              content: combinedContent
            }
          ]
        })
      });

      if (!openRouterResponse.ok) {
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }

      const openRouterData = await openRouterResponse.json();
      const extractedContent = openRouterData.choices?.[0]?.message?.content;

      if (!extractedContent) {
        throw new Error('No content received from OpenRouter');
      }

      // Parse the JSON response
      let jobData: JobData;
      try {
        // Clean the response to ensure it's valid JSON
        const cleanedContent = extractedContent.replace(/```json\n?|\n?```/g, '').trim();
        jobData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse OpenRouter response:', parseError);
        throw new Error('Failed to parse job data from AI response');
      }

      // Validate the extracted data structure
      const validatedJobData: JobData = {
        title: jobData.title || 'Unknown Title',
        platform: jobData.platform || 'Other',
        budget: jobData.budget || null,
        duration: jobData.duration || null,
        skills: Array.isArray(jobData.skills) ? jobData.skills : [],
        description: jobData.description || content.substring(0, 1000) + '...', // Fallback to raw content
        clientRequirements: Array.isArray(jobData.clientRequirements) ? jobData.clientRequirements : [],
        experienceLevel: jobData.experienceLevel || null,
        proposals: jobData.proposals || null,
        postedTime: jobData.postedTime || null,
        clientLocation: jobData.clientLocation || null,
        paymentVerified: jobData.paymentVerified || null
      };

      // STEP 4: Return extracted job data
      return NextResponse.json({
        success: true,
        data: validatedJobData
      });

    } catch (error) {
      console.error('OpenRouter API error:', error);
      
      // If AI extraction fails, return whatever content we managed to fetch
      return NextResponse.json({
        success: true,
        data: {
          title: 'Job Post (Extraction Failed)',
          platform: 'Other' as const,
          budget: null,
          duration: null,
          skills: [],
          description: content || serpApiContent || 'Unable to extract job description',
          clientRequirements: [],
          experienceLevel: null,
          proposals: null,
          postedTime: null,
          clientLocation: null,
          paymentVerified: null
        }
      });
    }

  } catch (error) {
    console.error('Job URL Agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
