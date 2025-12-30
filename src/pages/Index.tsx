import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar, ChatHistoryItem } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

const DAILY_LIMIT = 50;

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>();
  const [usageCount, setUsageCount] = useState(0);
  const [activeSection, setActiveSection] = useState<'history' | 'tools'>('history');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/auth', { replace: true });
  }, [signOut, navigate]);

  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    setActiveChatId(newId);
    setMobileMenuOpen(false);
  }, []);

  const handleAddToHistory = useCallback((title: string) => {
    const newChat: ChatHistoryItem = {
      id: activeChatId || Date.now().toString(),
      title: title.length > 40 ? title.slice(0, 40) + '...' : title,
      date: 'Just now',
      timestamp: new Date(),
    };
    
    setChatHistory(prev => {
      const exists = prev.find(c => c.id === newChat.id);
      if (exists) {
        return prev.map(c => c.id === newChat.id ? { ...c, title: newChat.title } : c);
      }
      return [newChat, ...prev];
    });
    
    setActiveChatId(newChat.id);
  }, [activeChatId]);

  const handleIncrementUsage = useCallback(() => {
    setUsageCount(prev => prev + 1);
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
    setMobileMenuOpen(false);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(undefined);
    }
  }, [activeChatId]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background w-full">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      {isMobile ? (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 glass md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] border-r border-glass-border/50">
            <Sidebar
              onNewChat={handleNewChat}
              isCollapsed={false}
              onToggleCollapse={() => {}}
              isMobile={true}
              chatHistory={chatHistory}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              activeChatId={activeChatId}
              usageCount={usageCount}
              usageLimit={DAILY_LIMIT}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              user={user}
              onSignOut={handleSignOut}
            />
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop Sidebar */
        <Sidebar
          onNewChat={handleNewChat}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={false}
          chatHistory={chatHistory}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          activeChatId={activeChatId}
          usageCount={usageCount}
          usageLimit={DAILY_LIMIT}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          user={user}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full min-w-0">
        <ChatInterface 
          isMobile={isMobile}
          onAddToHistory={handleAddToHistory}
          onIncrementUsage={handleIncrementUsage}
          activeChatId={activeChatId}
        />
      </main>
    </div>
  );
};

export default Index;
