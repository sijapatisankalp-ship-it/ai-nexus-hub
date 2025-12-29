import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponseColumn } from './ResponseColumn';
import { ModelResponse } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ComparisonViewProps = {
  selectedModels: string[];
  responses: Record<string, ModelResponse>;
  userMessage: string;
  onRetry?: (modelId: string) => void;
};

export const ComparisonView = ({ 
  selectedModels, 
  responses, 
  userMessage,
  onRetry 
}: ComparisonViewProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset active index when selected models change
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedModels.length]);

  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => Math.min(selectedModels.length - 1, prev + 1));
  };

  // Mobile card-swipe view
  if (isMobile) {
    return (
      <div className="relative h-full flex flex-col overflow-hidden">
        {/* Navigation dots */}
        <div className="flex-shrink-0 py-2 flex justify-center gap-2">
          {selectedModels.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === activeIndex 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-muted hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>

        {/* Cards container */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {/* Navigation arrows */}
          {activeIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 glass h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {activeIndex < selectedModels.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 glass h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="h-full px-3 py-2 overflow-hidden"
            >
              <ResponseColumn
                modelId={selectedModels[activeIndex]}
                response={responses[selectedModels[activeIndex]] || null}
                userMessage={userMessage}
                onRetry={onRetry ? () => onRetry(selectedModels[activeIndex]) : undefined}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Desktop side-by-side view
  return (
    <div 
      ref={scrollRef}
      className="h-full flex gap-4 p-4 overflow-x-auto scrollbar-thin"
    >
      {selectedModels.map((modelId, index) => (
        <motion.div
          key={modelId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex-1 min-w-[300px] max-w-[500px] h-full"
        >
          <ResponseColumn
            modelId={modelId}
            response={responses[modelId] || null}
            userMessage={userMessage}
            onRetry={onRetry ? () => onRetry(modelId) : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
};
