// src/components/ChatMessage.tsx
import React from 'react';
import { Card } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { Message } from '../types';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const alignClass = isUser ? 'justify-end' : 'justify-start';

  const renderContent = () => {
    if (message.isCode && message.language) {
      return <CodeBlock language={message.language} code={message.text} />;
    } else {
      const isError = message.text.startsWith("Error:");
      const cardClass = isUser
        ? 'bg-blue-500 text-white'
        : (isError ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800');
      return (
        <Card
          size="small"
          className={`max-w-xl md:max-w-2xl lg:max-w-3xl break-words whitespace-pre-wrap ${cardClass}`}
          bodyStyle={{ padding: '8px 12px' }}
        >
          {message.text}
        </Card>
      );
    }
  };

  return (
    <div className={`flex ${alignClass} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-2 mt-1">
          <RobotOutlined style={{ fontSize: '18px', color: '#4a5568' }} />
        </div>
      )}
      <div className="flex flex-col max-w-[80%]">
        {renderContent()}
        <p className="text-xs text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 ml-2 mt-1">
          <UserOutlined style={{ fontSize: '18px', color: '#4299e1' }} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;