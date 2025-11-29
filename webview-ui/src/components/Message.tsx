import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { DisplayMessage } from '../types';
import { ToolCallDisplay } from './ToolCallDisplay';
import { useTheme } from '../hooks/useTheme';

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

  const messageClasses = `mb-4 p-3 rounded-lg bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] ${
    role === 'user' ? 'bg-[var(--vscode-input-background)] border-l-[3px] border-l-[var(--vscode-textLink-foreground)]' : ''
  } ${isReasoning ? 'border-l-[3px] border-l-[var(--vscode-textLink-activeForeground)] bg-[var(--vscode-textBlockQuote-background)]' : ''} ${
    role === 'system' ? 'bg-[var(--vscode-textBlockQuote-background)] border-l-4 border-l-[var(--vscode-textBlockQuote-border)]' : ''
  } ${isError ? 'bg-[var(--vscode-inputValidation-errorBackground)] border-[var(--vscode-inputValidation-errorBorder)] border-l-4 border-l-[var(--vscode-inputValidation-errorBorder)]' : ''}`;

  return (
    <div className={messageClasses}>
      <div className="flex items-center gap-2 mb-2 text-xs text-[var(--vscode-descriptionForeground)]">
        <span className="font-semibold text-[var(--vscode-foreground)]">
          {role === 'user' ? '👤 User' : role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}
        </span>
        {hasToolActivity && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-lg bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]">
            {toolCalls && toolCalls.length > 0 ? '🔧 Tool Activity' : ''}
          </span>
        )}
        <span className="opacity-70 ml-auto">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="text-[var(--vscode-foreground)]">
        {/* Reasoning text section */}
        {content && (
          <div className={`leading-relaxed [&_p]:m-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_code]:bg-[var(--vscode-textCodeBlock-background)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.9em] [&_pre]:my-2 [&_pre]:rounded [&_pre]:overflow-x-auto ${isReasoning ? 'p-2 rounded bg-[var(--vscode-textBlockQuote-background)] border-l-2 border-l-[var(--vscode-textLink-activeForeground)]' : ''}`}>
            {isReasoning && (
              <div className="text-[11px] font-semibold text-[var(--vscode-textLink-activeForeground)] mb-1.5 uppercase tracking-wide">
                💭 Reasoning:
              </div>
            )}
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
            {isStreaming && (
              <span className="inline-block animate-[blink_1s_infinite] text-[var(--vscode-editorCursor-foreground)] ml-0.5">
                ▊
              </span>
            )}
          </div>
        )}

        {/* Display tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-3">
            {toolCalls.map((toolCall, index) => (
              <ToolCallDisplay key={index} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Display tool results */}
        {toolResults && toolResults.length > 0 && (
          <div className="mt-3">
            {toolResults.map((result, index) => (
              <ToolCallDisplay key={index} toolCall={{ type: 'tool_use', name: result.tool_name, params: {} }} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
