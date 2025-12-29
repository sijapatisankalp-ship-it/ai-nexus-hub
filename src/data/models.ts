import { AIModel, ProjectMode } from '@/types/chat';

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    icon: '🟢',
    color: 'from-emerald-500 to-green-600',
    description: 'Most capable GPT model for complex tasks',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    icon: '🟠',
    color: 'from-orange-500 to-amber-600',
    description: 'Balanced intelligence and speed',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    icon: '🔵',
    color: 'from-blue-500 to-indigo-600',
    description: 'Multimodal reasoning powerhouse',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    icon: '🟣',
    color: 'from-purple-500 to-violet-600',
    description: 'Advanced coding and reasoning',
  },
  {
    id: 'qwen3',
    name: 'Qwen3 4B',
    provider: 'Bytez',
    icon: '🔴',
    color: 'from-red-500 to-rose-600',
    description: 'Fast instruction-tuned model',
  },
];

export const PROJECT_MODES: ProjectMode[] = [
  {
    id: 'general',
    name: 'General',
    icon: '💬',
    description: 'Default conversational mode',
    systemPrompt: 'You are a helpful, harmless, and honest AI assistant.',
  },
  {
    id: 'fact-check',
    name: 'Fact-Check',
    icon: '🔍',
    description: 'Verify claims with sources',
    systemPrompt: 'You are a neutral, highly critical fact-checker. For every claim made, evaluate it against known datasets. Cite sources where possible and highlight any potential biases or logical fallacies.',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📈',
    description: 'Persuasive, SEO-optimized content',
    systemPrompt: 'You are an expert growth marketer. Your responses must be persuasive, SEO-optimized, and focused on high conversion. Use frameworks like AIDA (Attention, Interest, Desire, Action).',
  },
  {
    id: 'coding',
    name: 'Code Review',
    icon: '💻',
    description: 'Technical analysis and debugging',
    systemPrompt: 'You are a Senior Full-Stack Developer. Analyze the provided code for security vulnerabilities, performance bottlenecks, and adherence to DRY (Don\'t Repeat Yourself) principles.',
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎨',
    description: 'Imaginative and artistic content',
    systemPrompt: 'You are a highly creative writer and artist. Generate imaginative, original, and emotionally engaging content. Think outside the box and embrace unconventional ideas.',
  },
];

export const BOOST_SYSTEM_PROMPT = `You are a Professional Prompt Engineer. Your task is to take a simple, 'lazy' user prompt and transform it into a highly effective, structured instruction.

Follow these rules:
1. Identify the core intent of the user.
2. Add 'Context': Explain the 'Who, Why, and For Whom.'
3. Add 'Constraints': Specify tone, length, and format.
4. Add 'Step-by-Step' logic: Ask the AI to think through the problem before answering.

Return ONLY the enhanced prompt, nothing else.`;
