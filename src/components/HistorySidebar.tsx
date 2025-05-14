// src/components/HistorySidebar.tsx
import React from 'react';
import { Button, List, Typography, Popconfirm, message as antdMessage } from 'antd';
import { PlusOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { ChatSession } from '../types';

const { Text } = Typography;

interface HistorySidebarProps {
  chatHistory: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  chatHistory,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) => {
  // Sort history by last updated, newest first
  const sortedHistory = [...chatHistory].sort((a, b) => b.lastUpdated - a.lastUpdated);

  const handleDelete = (e: React.MouseEvent | undefined, chatId: string) => {
    e?.stopPropagation(); // Prevent chat selection when clicking delete
    onDeleteChat(chatId);
    antdMessage.success('Chat deleted');
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={onNewChat}
        >
          New Chat
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <List
          dataSource={sortedHistory}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              onClick={() => onSelectChat(item.id)}
              className={`
                cursor-pointer hover:bg-gray-200 px-4 py-2 border-l-4
                ${item.id === currentChatId
                  ? 'bg-blue-100 border-blue-500'
                  : 'border-transparent'}
                flex justify-between items-center group
              `} // Added group class
            >
              <div className="flex items-center overflow-hidden mr-2">
                 <MessageOutlined className="mr-2 flex-shrink-0" />
                 <Text ellipsis={{ tooltip: item.title }} className="flex-grow">
                     {item.title || 'New Chat'}
                 </Text>
              </div>
              <Popconfirm
                title="Delete this chat?"
                description="Are you sure you want to delete this chat session?"
                onConfirm={(e) => handleDelete(e, item.id)}
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  icon={<DeleteOutlined />}
                  type="text"
                  size="small"
                  danger
                  className="opacity-0 group-hover:opacity-100 transition-opacity" // Show on hover
                  onClick={(e) => e.stopPropagation()} // Important to stop propagation here too
                  aria-label="Delete chat"
                />
              </Popconfirm>
            </List.Item>
          )}
          locale={{ emptyText: 'No chat history' }}
        />
      </div>
    </div>
  );
};

export default HistorySidebar;