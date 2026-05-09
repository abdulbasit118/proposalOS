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

function extractPlatformFromUrl(url: string): JobData['platform'] {
  if (url.includes('upwork.com')) return 'Upwork';
  if (url.includes('fiverr.com')) return 'Fiverr';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('freelancer.com')) return 'Freelancer';
  return 'Other';
}

function extractKeywordsFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(part => part.length > 2);
  return pathParts.join(' ').replace(/[-_]/g, ' ').slice(0, 100);
}

async function extractJobDataFromContent(content: string, platform: JobData['platform'], isPartial: boolean = false): Promise<JobData | null> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

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
Extract structured data from this job posting content.

Return ONLY this JSON:
{
  title: string,
  platform: 'Upwork' | 'Fiverr' | 'LinkedIn' | 'Freelancer' | 'Other',
  budget: string or null,
  duration: string or null,
  skills: string[],
  description: string (full job description),
  clientRequirements: string[],
  experienceLevel: 'Entry' | 'Intermediate' | 'Expert' | null,
  proposals: string or null (number of proposals),
  postedTime: string or null,
  clientLocation: string or null,
  paymentVerified: boolean or null
}

Platform is: ${platform}
${isPartial ? 'Note: This is partial content, extract what you can.' : ''}

If you cannot find certain fields, use null.
Return ONLY valid JSON.`
          },
          {
            role: 'user',
            content: content
          }
        ]
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
    }

    const openRouterData = await openRouterResponse.json();
    const rawText = openRouterData.choices?.[0]?.message?.content;

    if (!rawText) {
      throw new Error('No content received from OpenRouter');
    }

    // Extract only JSON part from response
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const jsonOnly = rawText.slice(start, end + 1);
    const jobData = JSON.parse(jsonOnly);

    // Validate and return extracted data
    return {
      title: jobData.title || 'Unknown Title',
      platform: jobData.platform || platform,
      budget: jobData.budget || null,
      duration: jobData.duration || null,
      skills: Array.isArray(jobData.skills) ? jobData.skills : [],
      description: jobData.description || content,
      clientRequirements: Array.isArray(jobData.clientRequirements) ? jobData.clientRequirements : [],
      experienceLevel: jobData.experienceLevel || null,
      proposals: jobData.proposals || null,
      postedTime: jobData.postedTime || null,
      clientLocation: jobData.clientLocation || null,
      paymentVerified: jobData.paymentVerified || null
    };

  } catch (error) {
    console.error('AI extraction failed:', error);
    return null;
  }
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

    const platform = extractPlatformFromUrl(url);
    let content = '';
    let isPartial = false;

    // STEP 1: Try SerpAPI Google Search FIRST
    try {
      if (!process.env.SERPAPI_KEY) {
        throw new Error('SerpAPI key not configured');
      }

      const keywords = extractKeywordsFromUrl(url);
      const searchQuery = `site:${new URL(url).hostname} ${keywords}`;
      
      const serpApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&num=5&api_key=${process.env.SERPAPI_KEY}`;
      const serpApiResponse = await fetch(serpApiUrl);
      
      if (serpApiResponse.ok) {
        const serpData = await serpApiResponse.json();
        
        // Extract text from organic results and knowledge graph
        const extractedTexts = [];
        
        if (serpData.organic_results && Array.isArray(serpData.organic_results)) {
          serpData.organic_results.forEach((result: { title?: string; snippet?: string }) => {
            if (result.title) extractedTexts.push(result.title);
            if (result.snippet) extractedTexts.push(result.snippet);
          });
        }
        
        if (serpData.knowledge_graph) {
          const kg = serpData.knowledge_graph as { title?: string; description?: string };
          if (kg.title) extractedTexts.push(kg.title);
          if (kg.description) extractedTexts.push(kg.description);
        }
        
        content = extractedTexts.join(' ').trim();
        
        // If we got substantial content, proceed with AI extraction
        if (content.length > 100) {
          const jobData = await extractJobDataFromContent(content, platform);
          if (jobData) {
            return NextResponse.json({
              success: true,
              data: jobData,
              source: 'serpapi'
            });
          }
        }
      }
    } catch (error) {
      console.error('SerpAPI search failed:', error);
    }

    // STEP 2: Try direct fetch as fallback
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (pageResponse.ok) {
        const rawContent = await pageResponse.text();
        const cleanContent = stripHtml(rawContent).slice(0, 3000);
        
        if (cleanContent.length > 50) {
          content = cleanContent;
          const jobData = await extractJobDataFromContent(content, platform);
          if (jobData) {
            return NextResponse.json({
              success: true,
              data: jobData,
              source: 'direct_fetch'
            });
          }
        }
      }
    } catch (error) {
      console.error('Direct fetch failed:', error);
    }

    // STEP 3: Fallback - return partial data or error
    if (content.length > 0) {
      const jobData = await extractJobDataFromContent(content, platform, true);
      isPartial = true;
      
      if (jobData) {
        return NextResponse.json({
          success: true,
          data: jobData,
          source: 'partial',
          message: isPartial ? 'We could not fully read this job post. Here is what we found:' : null
        });
      }
    }

    // If everything fails
    return NextResponse.json({
      success: false,
      error: 'Unable to extract job details from the provided URL',
      message: 'This URL may require login or is not publicly accessible. Try copying the job description and pasting it directly.'
    });

  } catch (error) {
    console.error('Job URL Agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
