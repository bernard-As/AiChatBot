// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message as antdMessage, ConfigProvider, theme } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatSession } from './types';
import HistorySidebar from './components/HistorySidebar';
import ChatInterface from './components/ChatInterface';
import { parseAIResponse } from './utils/responseParser';
const { Sider, Content } = Layout;

// --- Configuration ---
const LLAMA_SERVER_URL = 'https://timetable.rdu.edu.tr/test/ai/completion'; // Adjust if your server runs elsewhere
const HISTORY_STORAGE_KEY = 'aiChatHistory';
// Assume the model running on llama-server corresponds to this ID
const DEFAULT_MODEL_ID = 'deepseek-coder-instruct';

function App() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Track the model ID associated with the current chat, defaults to the server's assumed model
  const [activeModelId, setActiveModelId] = useState<string>(DEFAULT_MODEL_ID);


  // --- History Management ---
  useEffect(() => {
    // Load history from local storage on initial mount
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsedHistory: ChatSession[] = JSON.parse(storedHistory);
        setChatHistory(parsedHistory);
        // Optional: load the last active chat?
         if (parsedHistory.length > 0) {
           // Sort by lastUpdated and select the most recent one initially
          //  const sortedHistory = [...parsedHistory].sort((a, b) => b.lastUpdated - a.lastUpdated);
           // selectChat(sortedHistory[0].id); // Uncomment to load last chat on startup
         }
      }
    } catch (error) {
       console.error("Failed to load chat history:", error);
       localStorage.removeItem(HISTORY_STORAGE_KEY); // Clear corrupted storage
    }
  }, []);

  useEffect(() => {
    // Save history to local storage whenever it changes
    if (chatHistory.length > 0) { // Avoid saving empty array unnecessarily on initial load
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
        } catch (error) {
            console.error("Failed to save chat history:", error);
            antdMessage.error("Could not save chat history. Local storage might be full.");
        }
    } else {
        localStorage.removeItem(HISTORY_STORAGE_KEY); // Clean up if history becomes empty
    }
  }, [chatHistory]);


  // --- Chat Selection and Creation ---
  const selectChat = useCallback((chatId: string | null) => {
    if (chatId === null) {
        // Start a new chat
        setCurrentChatId(null);
        setCurrentMessages([]);
        setActiveModelId(DEFAULT_MODEL_ID); // Reset to default model for new chat
    } else {
        const selected = chatHistory.find(chat => chat.id === chatId);
        if (selected) {
            setCurrentChatId(selected.id);
            setCurrentMessages(selected.messages);
             // Set the active model to the one used in the selected chat, or default
            setActiveModelId(selected.modelId || DEFAULT_MODEL_ID);
        } else {
            console.error("Selected chat ID not found:", chatId);
            antdMessage.error("Could not find the selected chat.");
            setCurrentChatId(null); // Fallback to new chat state
            setCurrentMessages([]);
        }
    }
  }, [chatHistory]); // Dependency: chatHistory

  const handleNewChat = () => {
    selectChat(null);
  };

  const handleDeleteChat = (chatId: string) => {
     setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
     // If the deleted chat was the current one, go to new chat state
     if (currentChatId === chatId) {
       selectChat(null);
     }
   };

  // --- Sending Messages & Backend Interaction ---
   const handleSendMessage = useCallback(async (text: string, modelId: string) => {
     const userMessage: Message = {
       id: uuidv4(),
       text,
       sender: 'user',
       timestamp: Date.now(),
     };

     setIsLoading(true);
     let updatedMessages = [...currentMessages, userMessage];
     setCurrentMessages(updatedMessages); // Show user message immediately

     let targetChatId = currentChatId;
     let newChatCreated = false;

     // --- Create new chat session if needed ---
     if (!targetChatId) {
       newChatCreated = true;
       targetChatId = uuidv4();
       const newSession: ChatSession = {
         id: targetChatId,
         title: text.substring(0, 40) + (text.length > 40 ? '...' : ''), // Simple title
         messages: [userMessage],
         lastUpdated: Date.now(),
         modelId: modelId, // Store the model used for this chat
       };
       setChatHistory(prev => [newSession, ...prev]);
       setCurrentChatId(targetChatId);
       setActiveModelId(modelId); // Update active model for this new chat
     } else {
       // Update existing chat session (only message list and timestamp for now)
       setChatHistory(prev =>
         prev.map(chat =>
           chat.id === targetChatId
             ? { ...chat, messages: updatedMessages, lastUpdated: Date.now() }
             : chat
         )
       );
     }

     // --- Prepare Prompt for llama-server ---
     // Basic prompt: just the user's message.
     // Advanced: Format history for context (requires careful templating based on the model)
     // Example advanced (pseudo-code, needs actual model template):
     // const prompt = formatHistoryForModel(updatedMessages, modelId);
     const prompt = `Instruction:\n${text}\n\nResponse:\n`; // Simple instruction format


     // --- Call llama-server ---
     try {
        const response = await fetch(LLAMA_SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            n_predict: 1024, // Max tokens to generate (adjust as needed)
            temperature: 0.7, // Adjust creativity/determinism
            stop: ["Instruction:", "\n\n"], // Stop sequences for the model
            // Add other llama.cpp parameters if needed (top_k, top_p, etc.)
          }),
        });
          console.log("Response from server:", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const aiResponseText = result.content;

        if (!aiResponseText) {
             throw new Error("Received empty content from server");
        }

         // Parse AI response into text/code blocks
         const responseParts = parseAIResponse(aiResponseText.trim());

         const aiMessages: Message[] = responseParts.map((part: { text: string; isCode?: boolean; language?: string }) => ({
            id: uuidv4(),
            sender: 'ai',
            timestamp: Date.now(),
            text: part.text,
            isCode: part.isCode,
            language: part.language,
          }));



        // Update messages state and history
        updatedMessages = [...updatedMessages, ...aiMessages]; // Add AI messages to the list
        setCurrentMessages(updatedMessages); // Update UI

        // Update the history again with the AI response included
         setChatHistory(prev =>
             prev.map(chat =>
                 chat.id === targetChatId
                   ? { ...chat, messages: updatedMessages, lastUpdated: Date.now() }
                   : chat
             )
         );


     } catch (error) {
       console.error('Error fetching AI response:', error);
       antdMessage.error('Failed to get response from AI server. Is llama-server running?');
        // Add error message to chat
        const errorMessage: Message = {
           id: uuidv4(),
           text: `Error: Could not connect to the AI server or process the request. Please check the console for details. (${error instanceof Error ? error.message : String(error)})`,
           sender: 'ai',
           timestamp: Date.now(),
        };
         updatedMessages = [...updatedMessages, errorMessage];
         setCurrentMessages(updatedMessages);
         setChatHistory(prev =>
           prev.map(chat =>
             chat.id === targetChatId
               ? { ...chat, messages: updatedMessages, lastUpdated: Date.now() }
               : chat
           )
         );
     } finally {
       setIsLoading(false);
       // If a new chat was created, make sure it remains selected
       if(newChatCreated && targetChatId) {
            setCurrentChatId(targetChatId);
       }
     }
   }, [currentChatId, currentMessages, chatHistory]); // Dependencies


  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={280} // Adjust width as needed
          theme="light" // Use light theme for sider to match example
          className="border-r border-gray-200" // Ensure border shows
           breakpoint="lg" // Responsive breakpoint
           collapsedWidth="0" // Hide completely on small screens
           trigger={null} // Disable default Antd trigger if using custom hiding
        >
          <HistorySidebar
            chatHistory={chatHistory}
            currentChatId={currentChatId}
            onSelectChat={selectChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
          />
        </Sider>
        <Layout>
          <Content style={{ margin: '0', background: '#fff' /* Ensure content bg */}}>
            <ChatInterface
              messages={currentMessages}
              currentModelId={activeModelId} // Pass the model relevant to the current chat
              // availableModels={...} // If you have a dynamic list
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              // onModelChange={...} // If you implement model switching logic
            />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;