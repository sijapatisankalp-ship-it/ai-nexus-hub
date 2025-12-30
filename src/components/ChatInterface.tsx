import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ProjectModeSelector } from './ProjectModeSelector';
import { ChatInput } from './ChatInput';
import { ComparisonView } from './ComparisonView';
import { Message, ModelResponse } from '@/types/chat';
import { AI_MODELS, PROJECT_MODES } from '@/data/models';
import { streamChat, boostPrompt } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ChatInterfaceProps = {
  isMobile?: boolean;
  onAddToHistory?: (title: string) => void;
  onIncrementUsage?: () => void;
  activeChatId?: string;
};

export const ChatInterface = ({ 
  isMobile = false, 
  onAddToHistory,
  onIncrementUsage,
  activeChatId
}: ChatInterfaceProps) => {
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o', 'claude-sonnet']);
  const [projectMode, setProjectMode] = useState('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const { toast } = useToast();

  // Reset when activeChatId changes (new chat)
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setResponses({});
      setCurrentUserMessage('');
    }
  }, [activeChatId]);

  const handleToggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const streamModelResponse = async (modelId: string, userMessage: string) => {
    const messageHistory = [{ role: 'user' as const, content: userMessage }];
    
    await streamChat(
      modelId,
      messageHistory,
      projectMode,
      {
        onDelta: (delta) => {
          setResponses(prev => ({
            ...prev,
            [modelId]: {
              modelId,
              content: (prev[modelId]?.content || '') + delta,
              isStreaming: true,
            }
          }));
        },
        onDone: () => {
          setResponses(prev => ({
            ...prev,
            [modelId]: {
              ...prev[modelId],
              isStreaming: false,
            }
          }));
        },
        onError: (error) => {
          console.error(`Error for model ${modelId}:`, error);
          setResponses(prev => ({
            ...prev,
            [modelId]: {
              modelId,
              content: '',
              isStreaming: false,
              error: error,
            }
          }));
          
          toast({
            title: `Error from ${AI_MODELS.find(m => m.id === modelId)?.name || modelId}`,
            description: error,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleSend = async (message: string) => {
    setIsLoading(true);
    setCurrentUserMessage(message);
    
    // Clear previous responses
    setResponses({});
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add to chat history with the message as title
    onAddToHistory?.(message);
    
    // Increment usage count
    onIncrementUsage?.();

    // Initialize streaming state for all selected models
    selectedModels.forEach(modelId => {
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          content: '',
          isStreaming: true,
        }
      }));
    });

    // Start streaming for all models concurrently
    try {
      await Promise.all(
        selectedModels.map(modelId => streamModelResponse(modelId, message))
      );
    } catch (error) {
      console.error('Error generating responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI responses. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleBoost = async (message: string): Promise<string> => {
    try {
      const boosted = await boostPrompt(message);
      toast({
        title: 'Prompt Enhanced',
        description: 'Your prompt has been optimized for better AI responses.',
      });
      return boosted;
    } catch (error) {
      toast({
        title: 'Boost Failed',
        description: 'Could not enhance prompt. Using original.',
        variant: 'destructive',
      });
      return message;
    }
  };

  const handleRetry = (modelId: string) => {
    if (currentUserMessage) {
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          content: '',
          isStreaming: true,
        }
      }));
      streamModelResponse(modelId, currentUserMessage);
    }
  };

  const hasResponses = Object.keys(responses).length > 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className={cn(
        "flex-shrink-0 p-4 border-b border-glass-border/50 glass",
        isMobile && "pt-16" // Extra padding for mobile menu button
      )}>
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Select AI Models</h2>
            <ModelSelector
              selectedModels={selectedModels}
              onToggleModel={handleToggleModel}
            />
          </div>
          <div className="flex-shrink-0">
            <ProjectModeSelector
              selectedMode={projectMode}
              onSelectMode={setProjectMode}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!hasResponses ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center p-4 md:p-8"
            >
              <div className="text-center max-w-md">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 md:mb-6 glow-primary">
                  <Zap className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 gradient-text">
                  Compare AI Responses
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                  Select up to 4 AI models and send a prompt to see how each one responds. 
                  Use the Boost feature to enhance your prompts automatically.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs md:text-sm">
                  <span className="px-2 md:px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Real AI streaming
                  </span>
                  <span className="px-2 md:px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                    GPT & Gemini models
                  </span>
                  <span className="px-2 md:px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    Prompt boosting
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="responses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-h-0 overflow-hidden flex flex-col"
            >
              {/* User message */}
              <div className="flex-shrink-0 p-3 md:p-4 border-b border-glass-border/30">
                <div className="chat-bubble user max-w-full">
                  <p className="text-sm break-words">{currentUserMessage}</p>
                </div>
              </div>

              {/* Comparison view */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ComparisonView
                  selectedModels={selectedModels}
                  responses={responses}
                  userMessage={currentUserMessage}
                  onRetry={handleRetry}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 md:p-4 border-t border-glass-border/50">
        <ChatInput
          onSend={handleSend}
          onBoost={handleBoost}
          isLoading={isLoading}
          disabled={selectedModels.length === 0}
        />
      </div>
    </div>
  );
};
