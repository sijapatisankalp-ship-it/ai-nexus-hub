import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { PROJECT_MODES } from '@/data/models';
import { cn } from '@/lib/utils';

type ProjectModeSelectorProps = {
  selectedMode: string;
  onSelectMode: (modeId: string) => void;
};

export const ProjectModeSelector = ({ 
  selectedMode, 
  onSelectMode 
}: ProjectModeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentMode = PROJECT_MODES.find(m => m.id === selectedMode) || PROJECT_MODES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
          "border border-glass-border/50 bg-glass/40 hover:border-glass-border",
          isOpen && "border-primary/40"
        )}
      >
        <span className="text-lg">{currentMode.icon}</span>
        <span className="text-sm font-medium">{currentMode.name}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 z-50 glass-strong rounded-xl overflow-hidden shadow-xl shadow-black/20"
            >
              <div className="p-2 space-y-1">
                {PROJECT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      onSelectMode(mode.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left",
                      mode.id === selectedMode
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary/60"
                    )}
                  >
                    <span className="text-xl">{mode.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{mode.name}</span>
                        {mode.id === selectedMode && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
