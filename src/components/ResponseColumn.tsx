import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AI_MODELS } from '@/data/models';
import { ModelResponse } from '@/types/chat';
import { cn } from '@/lib/utils';

type ResponseColumnProps = {
  modelId: string;
  response: ModelResponse | null;
  userMessage: string;
  onRetry?: () => void;
};

export const ResponseColumn = ({ 
  modelId, 
  response, 
  userMessage,
  onRetry 
}: ResponseColumnProps) => {
  const [copied, setCopied] = useState(false);
  
  const model = AI_MODELS.find(m => m.id === modelId);
  
  if (!model) return null;

  const handleCopy = async () => {
    if (response?.content) {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 min-w-[280px] flex flex-col glass rounded-xl overflow-hidden"
    >
      {/* Model Header */}
      <div className={cn(
        "p-3 border-b border-glass-border/50 flex items-center justify-between",
        "bg-gradient-to-r opacity-90",
        model.color
      )}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{model.icon}</span>
          <div>
            <h3 className="font-semibold text-primary-foreground">{model.name}</h3>
            <p className="text-xs text-primary-foreground/70">{model.provider}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {response?.content && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          )}
          {onRetry && response?.error && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRetry}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Response Content */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        {!response && !userMessage && (
          <p className="text-muted-foreground text-center py-8">
            Waiting for your message...
          </p>
        )}

        {response?.isStreaming && !response.content && (
          <div className="flex items-center gap-2 py-8 justify-center">
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0s' }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0.2s' }} />
              <span className="h-2 w-2 rounded-full bg-primary animate-typing" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        )}

        {response?.content && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-invert prose-sm max-w-none"
          >
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {response.content}
              {response.isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
              )}
            </div>
          </motion.div>
        )}

        {response?.error && (
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-2">{response.error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {response?.content && !response.isStreaming && (
        <div className="p-2 border-t border-glass-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{response.content.split(/\s+/).length} words</span>
          <span>{response.content.length} chars</span>
        </div>
      )}
    </motion.div>
  );
};
