import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  History, 
  Wrench, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Sparkles,
  Settings,
  Zap,
  Trash2,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User } from '@supabase/supabase-js';

export type ChatHistoryItem = {
  id: string;
  title: string;
  date: string;
  timestamp: Date;
};

type SidebarProps = {
  onNewChat: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  chatHistory: ChatHistoryItem[];
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  activeChatId?: string;
  usageCount: number;
  usageLimit: number;
  activeSection: 'history' | 'tools';
  onSectionChange: (section: 'history' | 'tools') => void;
  user?: User | null;
  onSignOut?: () => void;
};

export const Sidebar = ({ 
  onNewChat, 
  isCollapsed, 
  onToggleCollapse, 
  isMobile = false,
  chatHistory,
  onSelectChat,
  onDeleteChat,
  activeChatId,
  usageCount,
  usageLimit,
  activeSection,
  onSectionChange,
  user,
  onSignOut
}: SidebarProps) => {
  // Mobile sidebar is always expanded inside the sheet
  const collapsed = isMobile ? false : isCollapsed;

  const usagePercentage = Math.min((usageCount / usageLimit) * 100, 100);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobile ? '100%' : (collapsed ? 72 : 280) }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "h-screen flex flex-col relative",
        !isMobile && "glass-strong border-r border-glass-border/50"
      )}
    >
      {/* Collapse Toggle - Only show on desktop */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-secondary border border-border hover:bg-primary hover:text-primary-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      )}

      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold gradient-text">AI Nexus</h1>
              <p className="text-xs text-muted-foreground">Multi-Model Compare</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-4">
        <Button
          variant="glow"
          className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-3 mb-2 flex gap-1">
        <Button
          variant={activeSection === 'history' ? 'secondary' : 'ghost'}
          size={collapsed ? 'icon-sm' : 'sm'}
          onClick={() => onSectionChange('history')}
          className={cn("flex-1", collapsed && "flex-none")}
        >
          <History className="h-4 w-4" />
          {!collapsed && <span className="ml-2">History</span>}
        </Button>
        <Button
          variant={activeSection === 'tools' ? 'secondary' : 'ghost'}
          size={collapsed ? 'icon-sm' : 'sm'}
          onClick={() => onSectionChange('tools')}
          className={cn("flex-1", collapsed && "flex-none")}
        >
          <Wrench className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Tools</span>}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        <AnimatePresence mode="wait">
          {activeSection === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1"
            >
              {chatHistory.length === 0 ? (
                <div className={cn("text-center py-8", collapsed && "py-4")}>
                  {!collapsed && (
                    <p className="text-sm text-muted-foreground">No chats yet</p>
                  )}
                </div>
              ) : (
                chatHistory.map((chat, index) => (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "w-full text-left p-2 rounded-lg transition-colors group flex items-center relative",
                      collapsed && "justify-center",
                      activeChatId === chat.id 
                        ? "bg-primary/20 border border-primary/30" 
                        : "hover:bg-secondary/60"
                    )}
                  >
                    <button
                      onClick={() => onSelectChat?.(chat.id)}
                      className="flex items-center flex-1 min-w-0"
                    >
                      <MessageSquare className={cn(
                        "h-4 w-4 flex-shrink-0",
                        activeChatId === chat.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )} />
                      {!collapsed && (
                        <div className="ml-2 overflow-hidden min-w-0 flex-1">
                          <p className="text-sm truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground">{chat.date}</p>
                        </div>
                      )}
                    </button>
                    {!collapsed && onDeleteChat && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeSection === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <button className={cn(
                "w-full text-left p-3 rounded-lg glass hover:border-primary/40 transition-all group",
                collapsed && "flex items-center justify-center p-2"
              )}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  {!collapsed && (
                    <div>
                      <p className="text-sm font-medium">Prompt Boost</p>
                      <p className="text-xs text-muted-foreground">Enhance your prompts</p>
                    </div>
                  )}
                </div>
              </button>

              <button className={cn(
                "w-full text-left p-3 rounded-lg glass hover:border-primary/40 transition-all group",
                collapsed && "flex items-center justify-center p-2"
              )}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-4 w-4 text-accent" />
                  </div>
                  {!collapsed && (
                    <div>
                      <p className="text-sm font-medium">Settings</p>
                      <p className="text-xs text-muted-foreground">Configure AI models</p>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-glass-border/50 space-y-3"
        >
          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSignOut}
                  className="flex-shrink-0 hover:bg-destructive/20 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Usage Stats */}
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                usagePercentage >= 90 ? "bg-destructive" : usagePercentage >= 70 ? "bg-warning" : "bg-primary"
              )} />
              <span className="text-xs text-muted-foreground">Free Tier</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className={cn(
                  "h-full rounded-full",
                  usagePercentage >= 90 
                    ? "bg-destructive" 
                    : "bg-gradient-to-r from-primary to-accent"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${usagePercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {usageCount} / {usageLimit} prompts used today
            </p>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};
