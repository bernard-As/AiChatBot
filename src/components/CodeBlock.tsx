// src/components/CodeBlock.tsx
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, message as antdMessage } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      antdMessage.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
      antdMessage.error('Failed to copy code.');
    }
  };

  return (
    <div className="code-block bg-[#2d2d2d] rounded-md overflow-hidden my-2 relative">
      <div className="flex justify-between items-center px-4 py-1 bg-[#3a3a3a] text-xs text-gray-300">
        <span>{language || 'code'}</span>
        <Button
          type="text"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          size="small"
          className="text-gray-300 hover:text-white"
          aria-label="Copy code to clipboard"
          title={copied ? 'Copied!' : 'Copy code to clipboard'}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: '0 0 4px 4px', background: '#1e1e1e' }}
        wrapLongLines={true}
      >
        {code.trim()}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;