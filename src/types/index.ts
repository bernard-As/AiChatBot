// src/types/index.ts
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isCode?: boolean;
  language?: string;
  timestamp: number; // Add timestamp
}

export interface Model {
  id: string;
  name: string;
  // endpoint?: string; // Less relevant if connecting to a single llama-server
}

// New Type for Chat History
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  modelId?: string; // Optional: track which model was used
}