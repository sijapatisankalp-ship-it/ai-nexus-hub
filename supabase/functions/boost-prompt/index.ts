import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Allowed origins for CORS - includes Lovable preview and common dev environments
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://lovable.dev',
];

// Helper to get CORS headers with origin validation
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed or matches Lovable app domains
  const isAllowedOrigin = origin && (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovable.dev')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// Input validation schema
const boostRequestSchema = z.object({
  prompt: z.string()
    .min(1, "Prompt cannot be empty")
    .max(4000, "Prompt too long (max 4000 characters)")
    .transform(s => s.trim())
});

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = boostRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(JSON.stringify({ 
        error: 'Invalid input',
        details: validationResult.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt } = validationResult.data;
    
    console.log('Boost request received');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a Professional Prompt Engineer. Your task is to take a simple, 'lazy' user prompt and transform it into a highly effective, structured instruction.

Follow these rules:
1. Identify the core intent of the user.
2. Add 'Context': Explain the 'Who, Why, and For Whom.'
3. Add 'Constraints': Specify tone, length, and format.
4. Add 'Step-by-Step' logic: Ask the AI to think through the problem before answering.

Return ONLY the enhanced prompt text, nothing else. Do not include any explanations or metadata.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Enhance this prompt: "${prompt}"` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Boost error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to boost prompt' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const boostedPrompt = data.choices?.[0]?.message?.content || prompt;
    
    console.log('Prompt boosted successfully');
    
    return new Response(JSON.stringify({ boostedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Boost error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
