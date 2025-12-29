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
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, "Message content cannot be empty").max(8000, "Message content too long")
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1, "At least one message required").max(50, "Too many messages"),
  modelId: z.enum(['gpt-4o', 'claude-sonnet', 'gemini-pro', 'deepseek', 'qwen3']),
  systemPrompt: z.string().max(4000, "System prompt too long").optional()
});

// Model mapping from frontend IDs to Lovable AI model names
const MODEL_MAP: Record<string, string> = {
  'gpt-4o': 'openai/gpt-5-mini',
  'claude-sonnet': 'google/gemini-2.5-flash',
  'gemini-pro': 'google/gemini-2.5-pro',
  'deepseek': 'google/gemini-2.5-flash-lite',
};

// Bytez model IDs
const BYTEZ_MODELS = ['qwen3'];
const BYTEZ_MODEL_MAP: Record<string, string> = {
  'qwen3': 'Qwen/Qwen3-4B-Instruct-2507',
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = chatRequestSchema.safeParse(body);
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

    const { messages, modelId, systemPrompt } = validationResult.data;
    
    console.log(`Chat request for model: ${modelId}`);
    
    // Check if this is a Bytez model
    if (BYTEZ_MODELS.includes(modelId)) {
      const BYTEZ_API_KEY = Deno.env.get('BYTEZ_API_KEY');
      if (!BYTEZ_API_KEY) {
        throw new Error('BYTEZ_API_KEY is not configured');
      }

      const bytezModel = BYTEZ_MODEL_MAP[modelId];
      console.log(`Using Bytez model: ${bytezModel}`);

      // Call Bytez API
      const bytezResponse = await fetch(`https://api.bytez.com/model/run/${encodeURIComponent(bytezModel)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${BYTEZ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful AI assistant. Be concise and clear in your responses.' },
            ...messages,
          ],
        }),
      });

      if (!bytezResponse.ok) {
        const errorText = await bytezResponse.text();
        console.error(`Bytez API error: ${bytezResponse.status}`, errorText);
        return new Response(JSON.stringify({ error: 'Bytez AI service error. Please try again.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const bytezData = await bytezResponse.json();
      console.log('Bytez response:', JSON.stringify(bytezData));

      // Convert Bytez response to SSE format for consistency
      const content = bytezData.output?.content || bytezData.output?.message?.content || 
                      (typeof bytezData.output === 'string' ? bytezData.output : JSON.stringify(bytezData.output));
      
      const sseData = `data: ${JSON.stringify({
        choices: [{ delta: { content } }]
      })}\n\ndata: [DONE]\n\n`;

      return new Response(sseData, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Lovable AI models
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Map the frontend model ID to the actual Lovable AI model
    const model = MODEL_MAP[modelId] || 'google/gemini-2.5-flash';
    
    console.log(`Using Lovable AI model: ${model}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful AI assistant. Be concise and clear in your responses.' },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
