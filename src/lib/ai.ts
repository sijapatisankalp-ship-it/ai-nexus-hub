import { supabase } from '@/integrations/supabase/client';
import { PROJECT_MODES } from '@/data/models';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type StreamCallbacks = {
  onDelta: (delta: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
};

export const streamChat = async (
  modelId: string,
  messages: Message[],
  projectModeId: string,
  callbacks: StreamCallbacks
): Promise<void> => {
  const mode = PROJECT_MODES.find(m => m.id === projectModeId);
  const systemPrompt = mode?.systemPrompt || 'You are a helpful AI assistant.';

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          modelId,
          messages,
          systemPrompt,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        callbacks.onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        // Handle CRLF
        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }

        // Skip empty lines and comments
        if (line.startsWith(':') || line.trim() === '') {
          continue;
        }

        // Parse SSE data
        if (!line.startsWith('data: ')) {
          continue;
        }

        const jsonStr = line.slice(6).trim();
        
        if (jsonStr === '[DONE]') {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          
          if (content) {
            callbacks.onDelta(content);
          }
        } catch {
          // Incomplete JSON, might be split across chunks
          // Put it back and wait for more data
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }
  } catch (error) {
    console.error('Stream chat error:', error);
    callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
  }
};

export const boostPrompt = async (prompt: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('boost-prompt', {
      body: { prompt },
    });

    if (error) {
      console.error('Boost error:', error);
      throw error;
    }

    return data.boostedPrompt || prompt;
  } catch (error) {
    console.error('Failed to boost prompt:', error);
    // Return original prompt if boosting fails
    return prompt;
  }
};
