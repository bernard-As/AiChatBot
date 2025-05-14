// src/utils/responseParser.ts
import { Message } from '../types';

// Helper to parse response into text and code blocks
export const parseAIResponse = (responseText: string): Omit<Message, 'id' | 'sender' | 'timestamp'>[] => {
  const messageParts: Omit<Message, 'id' | 'sender' | 'timestamp'>[] = [];
  // Regex to find code blocks like ```language\n code \n``` or ```\n code \n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]+?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(responseText)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      const textPart = responseText.substring(lastIndex, match.index).trim();
      if (textPart) {
        messageParts.push({ text: textPart, isCode: false });
      }
    }

    // Add the code block
    const language = match[1] || 'plaintext'; // Default language if not specified
    const code = match[2].trim();
    messageParts.push({ text: code, isCode: true, language });

    lastIndex = codeBlockRegex.lastIndex;
  }

  // Add any remaining text after the last code block
  if (lastIndex < responseText.length) {
    const remainingText = responseText.substring(lastIndex).trim();
    if (remainingText) {
      messageParts.push({ text: remainingText, isCode: false });
    }
  }

  // If no code blocks were found, and the text is not empty, the whole message is text
  if (messageParts.length === 0 && responseText.trim()) {
    messageParts.push({ text: responseText.trim(), isCode: false });
  }

   // If the original text was effectively empty or just whitespace
   if (messageParts.length === 0 && !responseText.trim()) {
     // Optionally return a default message or an empty array
     // console.warn("AI response was empty or whitespace.");
     return []; // Return empty array if nothing to parse
   }


  return messageParts;
};