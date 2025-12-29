import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AI_MODELS } from '@/data/models';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type ModelSelectorProps = {
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  maxModels?: number;
};

export const ModelSelector = ({ 
  selectedModels, 
  onToggleModel, 
  maxModels = 4 
}: ModelSelectorProps) => {
  const handleToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      if (selectedModels.length > 1) {
        onToggleModel(modelId);
      }
    } else if (selectedModels.length < maxModels) {
      onToggleModel(modelId);
    }
  };

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {AI_MODELS.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            const isDisabled = !isSelected && selectedModels.length >= maxModels;

            return (
              <motion.button
                key={model.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleToggle(model.id)}
                disabled={isDisabled}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0",
                  "border backdrop-blur-sm",
                  isSelected
                    ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-glass-border/50 bg-glass/40 hover:border-glass-border",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-primary scale-100" 
                    : "bg-transparent scale-0"
                )}>
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>

                {/* Model icon */}
                <span className="text-base md:text-lg">{model.icon}</span>

                {/* Model info */}
                <div className="text-left">
                  <p className={cn(
                    "text-xs md:text-sm font-medium whitespace-nowrap",
                    isSelected && "text-primary"
                  )}>
                    {model.name}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{model.provider}</p>
                </div>
              </motion.button>
            );
          })}

          {/* Selection count */}
          <div className="flex items-center px-3 text-xs text-muted-foreground flex-shrink-0">
            <span className="text-primary font-medium">{selectedModels.length}</span>
            <span>/{maxModels}</span>
          </div>
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
};
