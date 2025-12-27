import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ProjectModeSelector } from './ProjectModeSelector';
import { ChatInput } from './ChatInput';
import { ComparisonView } from './ComparisonView';
import { Message, ModelResponse } from '@/types/chat';
import { AI_MODELS, PROJECT_MODES, BOOST_SYSTEM_PROMPT } from '@/data/models';

export const ChatInterface = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o', 'claude-sonnet']);
  const [projectMode, setProjectMode] = useState('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState('');

  const handleToggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const simulateStreamingResponse = async (modelId: string, userMessage: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    const mode = PROJECT_MODES.find(m => m.id === projectMode);
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate a mock response based on the model and mode
    const responses: Record<string, string> = {
      'gpt-4o': `Based on your query "${userMessage}", here's my analysis:\n\n${mode?.id === 'coding' ? 'Looking at this from a technical perspective, ' : mode?.id === 'marketing' ? 'From a marketing standpoint, ' : ''}I'll provide a comprehensive response.\n\n1. **Key Points**: The main aspects to consider here involve understanding the context and requirements clearly.\n\n2. **Analysis**: After careful consideration, I believe the best approach would be to break this down into manageable components.\n\n3. **Recommendations**: I suggest starting with a structured plan and iterating based on feedback.\n\nWould you like me to elaborate on any of these points?`,
      
      'claude-sonnet': `Thank you for your question about "${userMessage}". Let me share my thoughts:\n\n${mode?.id === 'fact-check' ? '🔍 **Fact Check Analysis**\n\n' : ''}I appreciate the nuanced nature of this query. Here's my perspective:\n\n**Understanding**: First, it's important to recognize the underlying assumptions in your question.\n\n**Considerations**:\n• Context matters significantly here\n• Multiple valid approaches exist\n• Trade-offs should be carefully evaluated\n\n**My Recommendation**: I'd suggest approaching this thoughtfully, considering both immediate needs and long-term implications.\n\nIs there a specific aspect you'd like me to dive deeper into?`,
      
      'gemini-pro': `Analyzing your request: "${userMessage}"\n\n${mode?.id === 'creative' ? '🎨 **Creative Perspective**\n\n' : ''}Here's what I've found:\n\n📊 **Overview**\nThis is an interesting question that touches on several important areas.\n\n🔑 **Key Insights**\n1. The fundamental principle here is understanding the core problem\n2. Multiple solutions exist, each with pros and cons\n3. Context-specific factors will influence the best choice\n\n💡 **Suggestions**\n- Start with clear requirements\n- Test and iterate\n- Gather feedback early\n\nLet me know if you need more details!`,
      
      'deepseek': `Query received: "${userMessage}"\n\n${mode?.id === 'coding' ? '```\n// Code Analysis Mode\n```\n\n' : ''}**Deep Analysis:**\n\nI've processed your request and here's my detailed response:\n\n**Technical Breakdown:**\n- Component 1: Core logic analysis\n- Component 2: Edge case handling\n- Component 3: Optimization considerations\n\n**Implementation Notes:**\n1. Consider the scalability implications\n2. Memory and performance trade-offs exist\n3. Testing strategy should be comprehensive\n\n**Conclusion:**\nThe optimal approach depends on your specific constraints. I'd recommend starting with a minimal viable solution and expanding from there.\n\nNeed me to elaborate on any technical details?`
    };

    const fullResponse = responses[modelId] || `Response from ${model?.name} for: "${userMessage}"`;
    
    // Simulate streaming by updating character by character
    let currentContent = '';
    for (let i = 0; i < fullResponse.length; i++) {
      currentContent += fullResponse[i];
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          content: currentContent,
          isStreaming: true,
        }
      }));
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
    }

    // Mark as complete
    setResponses(prev => ({
      ...prev,
      [modelId]: {
        modelId,
        content: fullResponse,
        isStreaming: false,
      }
    }));
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
        selectedModels.map(modelId => simulateStreamingResponse(modelId, message))
      );
    } catch (error) {
      console.error('Error generating responses:', error);
    }

    setIsLoading(false);
  };

  const handleBoost = async (message: string): Promise<string> => {
    // Simulate prompt boosting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enhanced prompt based on the mode
    const mode = PROJECT_MODES.find(m => m.id === projectMode);
    const modeContext = mode?.id === 'coding' 
      ? 'from a software engineering perspective, considering best practices, performance, and maintainability'
      : mode?.id === 'marketing'
      ? 'with a focus on conversion optimization, SEO best practices, and persuasive copywriting using the AIDA framework'
      : mode?.id === 'fact-check'
      ? 'with emphasis on verifiable sources, logical analysis, and identification of potential biases'
      : mode?.id === 'creative'
      ? 'with creative flair, original thinking, and engaging storytelling elements'
      : 'with clarity, structure, and actionable insights';

    return `Please provide a comprehensive analysis ${modeContext}.\n\nOriginal request: "${message}"\n\nRequirements:\n1. Break down the response into clear sections\n2. Provide specific, actionable recommendations\n3. Include relevant examples where applicable\n4. Consider potential edge cases or limitations\n5. Summarize key takeaways at the end`;
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
      simulateStreamingResponse(modelId, currentUserMessage);
    }
  };

  const hasResponses = Object.keys(responses).length > 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-glass-border/50 glass">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2 md:mb-0">Select AI Models</h2>
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
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="text-center max-w-md">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 glow-primary">
                  <Zap className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-3 gradient-text">
                  Compare AI Responses
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select up to 4 AI models and send a prompt to see how each one responds. 
                  Use the Boost feature to enhance your prompts automatically.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Side-by-side comparison
                  </span>
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                    Real-time streaming
                  </span>
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
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
              className="flex-1 min-h-0 overflow-hidden"
            >
              {/* User message */}
              <div className="p-4 border-b border-glass-border/30">
                <div className="chat-bubble user">
                  <p className="text-sm">{currentUserMessage}</p>
                </div>
              </div>

              {/* Comparison view */}
              <ComparisonView
                selectedModels={selectedModels}
                responses={responses}
                userMessage={currentUserMessage}
                onRetry={handleRetry}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-glass-border/50">
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
