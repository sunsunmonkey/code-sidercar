import React, { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import './InputBox.css';

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
    <div className="input-box">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Type your message... (Ctrl+Enter to send)"
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        
        <div className="input-actions">
          {onClear && (
            <button
              className="clear-button"
              onClick={onClear}
              disabled={disabled}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              🗑️
            </button>
          )}
          
          <button
            className="send-button"
            onClick={handleSend}
            disabled={disabled || !inputValue.trim()}
            title="Send message (Ctrl+Enter)"
            aria-label="Send message"
          >
            {disabled ? (
              <span className="loading-indicator">
                <span className="spinner"></span>
                Processing...
              </span>
            ) : (
              <>
                <span className="send-icon">📤</span>
                Send
              </>
            )}
          </button>
        </div>
      </div>
      
      {disabled && (
        <div className="status-indicator">
          <span className="status-dot"></span>
          AI is thinking...
        </div>
      )}
    </div>
  );
};
