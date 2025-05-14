// src/components/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { Message, Model } from '../types';
import ChatMessage from './ChatMessage';

const { TextArea } = Input;
// const { Option } = Select;

// Keep available models for the UI, even if backend server runs one
// You might fetch these from the backend in a real scenario if it supports multiple models
 const AVAILABLE_MODELS: Model[] = [
   { id: 'deepseek-coder-instruct', name: 'Deepseek Coder (Instruct)' },
   { id: 'deepseek-coder-base', name: 'Deepseek Coder (Base)' },
   { id: 'generic-chat', name: 'Generic Chat Model' }, // Placeholder
 ];

interface ChatInterfaceProps {
  messages: Message[];
  currentModelId: string; // The model assumed to be running on the server
  availableModels?: Model[]; // Optional: if you want to show a selector
  onSendMessage: (text: string, modelId: string) => Promise<void>; // Make async to handle loading state
  isLoading: boolean;
  // onModelChange?: (modelId: string) => void; // Optional: if switching is relevant
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  currentModelId, // Use this as the effective model
  availableModels = AVAILABLE_MODELS, // Default to static list
  onSendMessage,
  isLoading,
  // onModelChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    setInputValue(''); // Clear input immediately
    await onSendMessage(trimmedInput, currentModelId); // Call parent handler
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Model Selector (Display Only or Functional if Backend Supports) ---
  // For this example, it primarily acts as a label for the backend model.
  // If your llama-server setup *could* switch models via API, you'd use onModelChange.
  const renderModelSelector = () => {
     // Find the current model name
     const currentModelName = availableModels.find(m => m.id === currentModelId)?.name || currentModelId;

     return (
       <div className='mb-4 text-sm text-gray-600'>
           Using model: <span className='font-semibold'>{currentModelName}</span>
           {/* Optionally, add a Select dropdown if switching is possible */}
           {/*
           <Select
               value={currentModelId}
               onChange={onModelChange} // If you implement switching
               style={{ width: 250, marginLeft: '10px' }}
               disabled={isLoading}
           >
               {availableModels.map((model) => (
                   <Option key={model.id} value={model.id}>
                       {model.name}
                   </Option>
               ))}
           </Select>
           */}
       </div>
     )
  }


  return (
    <div className="flex flex-col h-full bg-white p-4">
      {/* Optional: Display the currently assumed model */}
       {renderModelSelector()}

      {/* Message Area */}
      <div className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center items-center p-4">
            <Spin size="large" tip="AI is thinking..." />
          </div>
        )}
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 flex items-center gap-2 border-t pt-4 border-gray-200">
        <TextArea
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here... (Shift+Enter for newline)"
          autoSize={{ minRows: 1, maxRows: 5 }}
          disabled={isLoading}
          className="flex-grow"
          aria-label="Chat input"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={isLoading}
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;