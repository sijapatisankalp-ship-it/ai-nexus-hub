export type AIModel = {
  id: string;
  name: string;
  provider: string;
  icon: string;
  color: string;
  description: string;
};

export type ProjectMode = {
  id: string;
  name: string;
  icon: string;
  systemPrompt: string;
  description: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelId?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  selectedModels: string[];
  projectMode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ModelResponse = {
  modelId: string;
  content: string;
  isStreaming: boolean;
  error?: string;
};
