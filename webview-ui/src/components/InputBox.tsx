import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';

interface InputBoxProps {
  onSend: (message: string) => void;
  onClear?: () => void;
  disabled: boolean;
}

/**
 * InputBox component for user input with multi-line support
 * Requirements: 4.1, 9.4
 */
export const InputBox: React.FC<InputBoxProps> = ({ onSend, onClear, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle send button click
   * Requirement 4.1: Support user input
   */
  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSend(inputValue);
      setInputValue('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * Handle keyboard shortcuts
   * Requirement 4.1: Support Ctrl+Enter to send
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    
    // Enter without Shift to send (optional behavior)
    // Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Auto-resize textarea based on content
   */
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  /**
   * Focus input on mount
   */
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="flex flex-col gap-2 p-3 bg-[var(--vscode-sideBar-background)] border-t border-[var(--vscode-panel-border)]">
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          className="w-full min-h-[40px] max-h-[200px] px-3 py-2.5 border border-[var(--vscode-input-border)] rounded bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] leading-normal resize-none overflow-y-auto outline-none transition-all placeholder:text-[var(--vscode-input-placeholderForeground)] focus:border-[var(--vscode-focusBorder)] focus:shadow-[0_0_0_1px_var(--vscode-focusBorder)] disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder="Type your message... (Ctrl+Enter to send)"
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        
        <div className="flex gap-2 justify-end items-center max-[400px]:flex-col max-[400px]:items-stretch">
          {onClear && (
            <button
              className="flex items-center gap-1 px-3 py-2 border-none rounded bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] cursor-pointer transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed max-[400px]:w-full max-[400px]:justify-center"
              onClick={onClear}
              disabled={disabled}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              🗑️
            </button>
          )}
          
          <button
            className="flex items-center justify-center gap-1.5 px-4 py-2 border-none rounded bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] font-medium cursor-pointer transition-all whitespace-nowrap min-w-[90px] hover:bg-[var(--vscode-button-hoverBackground)] active:translate-y-px disabled:opacity-70 disabled:cursor-not-allowed max-[400px]:w-full"
            onClick={handleSend}
            disabled={disabled || !inputValue.trim()}
            title="Send message (Ctrl+Enter)"
            aria-label="Send message"
          >
            {disabled ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-[var(--vscode-button-foreground)] border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                <span className="text-base">📤</span>
                Send
              </>
            )}
          </button>
        </div>
      </div>
      
      {disabled && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-badge-background)] rounded self-start">
          <span className="inline-block w-2 h-2 bg-[var(--vscode-charts-blue)] rounded-full animate-pulse"></span>
          AI is thinking...
        </div>
      )}
    </div>
  );
};
