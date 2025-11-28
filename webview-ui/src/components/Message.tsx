import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { DisplayMessage } from '../types';
import { ToolCallDisplay } from './ToolCallDisplay';
import { useTheme } from '../hooks/useTheme';
import './Message.css';

interface MessageProps {
  message: DisplayMessage;
}

/**
 * Message component displays a single message with support for:
 * - Text content with Markdown rendering
 * - Code blocks with syntax highlighting (theme-aware)
 * - Tool calls and results
 * Requirements: 3.5, 4.1, 4.2, 9.3, 14.1, 14.2, 14.4, 14.5
 */
export const Message: React.FC<MessageProps> = ({ message }) => {
  const themeKind = useTheme();
  const { role, content, toolCalls, toolResults, isError, isStreaming } = message;

  // Select syntax highlighter theme based on VSCode theme
  const syntaxTheme = themeKind === 'light' ? vs : vscDarkPlus;

  // Determine if this is a reasoning message (assistant with text content)
  const isReasoning = role === 'assistant' && content && !isError;
  const hasToolActivity = (toolCalls && toolCalls.length > 0) || (toolResults && toolResults.length > 0);

  return (
    <div className={`message message-${role} ${isError ? 'message-error' : ''} ${isReasoning ? 'message-reasoning' : ''}`}>
      <div className="message-header">
        <span className="message-role">
          {role === 'user' ? '👤 User' : role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}
        </span>
        {hasToolActivity && (
          <span className="message-type-badge">
            {toolCalls && toolCalls.length > 0 ? '🔧 Tool Activity' : ''}
          </span>
        )}
        <span className="message-timestamp">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="message-content">
        {/* Reasoning text section */}
        {content && (
          <div className={`message-text ${isReasoning ? 'reasoning-text' : ''}`}>
            {isReasoning && <div className="reasoning-label">💭 Reasoning:</div>}
            <ReactMarkdown
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return language ? (
                    <SyntaxHighlighter
                      style={syntaxTheme as any}
                      language={language}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && <span className="streaming-cursor">▊</span>}
          </div>
        )}

        {/* Display tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="tool-calls-section">
            {toolCalls.map((toolCall, index) => (
              <ToolCallDisplay key={index} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Display tool results */}
        {toolResults && toolResults.length > 0 && (
          <div className="tool-results-section">
            {toolResults.map((result, index) => (
              <ToolCallDisplay key={index} toolCall={{ type: 'tool_use', name: result.tool_name, params: {} }} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
