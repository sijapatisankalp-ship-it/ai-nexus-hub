import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatInputProps = {
  onSend: (message: string) => void;
  onBoost: (message: string) => Promise<string>;
  isLoading: boolean;
  disabled?: boolean;
};

export const ChatInput = ({ onSend, onBoost, isLoading, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isBoosting, setIsBoosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleBoost = async () => {
    if (message.trim() && !isBoosting) {
      setIsBoosting(true);
      try {
        const boostedMessage = await onBoost(message.trim());
        setMessage(boostedMessage);
      } finally {
        setIsBoosting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-2"
    >
      <div className="flex items-end gap-2">
        {/* Boost Button */}
        <Button
          variant="glass"
          size="icon"
          onClick={handleBoost}
          disabled={!message.trim() || isBoosting || isLoading}
          className={cn(
            "flex-shrink-0 transition-all",
            message.trim() && "hover:border-accent/60 hover:text-accent"
          )}
          title="Boost prompt with AI"
        >
          {isBoosting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, compare AI responses..."
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "w-full bg-transparent text-foreground placeholder:text-muted-foreground",
              "resize-none outline-none py-3 px-4",
              "max-h-[200px] scrollbar-thin",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Send Button */}
        <Button
          variant="glow"
          size="icon"
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
          className={cn(
            "flex-shrink-0 transition-all",
            (!message.trim() || isLoading) && "opacity-50"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Character count */}
      <div className="flex items-center justify-between px-2 pt-1">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 rounded bg-secondary text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-secondary text-xs">Shift+Enter</kbd> for new line
        </p>
        <p className="text-xs text-muted-foreground">
          {message.length}/4000
        </p>
      </div>
    </motion.div>
  );
};
