import React, { useRef, useEffect, useCallback } from "react";
import TextareaAutosize from "react-textarea-autosize";
import type { KeyboardEvent } from "react";
import { Send, Square, Trash2 } from "lucide-react";

interface InputBoxProps {
  onSend: (message: string) => void;
  onClear?: () => void;
  onCancel?: () => void;
  isProcessing: boolean;
  inputValue: string;
  setInputValue: (text: string) => void;
  className?: string;
  modeSelector?: React.ReactNode;
}

/**
 * InputBox component for user input with multi-line support
 * Requirements: 4.1, 9.4
 */
export const InputBox: React.FC<InputBoxProps> = ({
  onSend,
  onClear,
  onCancel,
  isProcessing,
  inputValue,
  setInputValue,
  className,
  modeSelector,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle send button click
   * Requirement 4.1: Support user input
   */
  const handleSend = useCallback(() => {
    if (isProcessing) {
      return;
    }
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue("");
    }
  }, [isProcessing, inputValue, onSend, setInputValue]);

  /**
   * Handle keyboard shortcuts
   * Requirement 4.1: Support Ctrl+Enter to send
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (isProcessing) {
        return;
      }
      const isComposing = e.nativeEvent?.isComposing ?? false;

      // Ctrl+Enter or Cmd+Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isComposing) {
        e.preventDefault();
        handleSend();
      }

      // Enter without Shift to send (optional behavior)
      // Shift+Enter for new line
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !isComposing
      ) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, isProcessing]
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
    },
    [setInputValue]
  );

  /**
   * Focus input on mount
   */
  useEffect(() => {
    if (textareaRef.current && !isProcessing) {
      textareaRef.current.focus();
    }
  }, [isProcessing]);

  const handlePrimaryAction = useCallback(() => {
    if (isProcessing) {
      onCancel?.();
      return;
    }
    handleSend();
  }, [handleSend, isProcessing, onCancel]);

  const isPrimaryDisabled =
    (isProcessing && !onCancel) || (!isProcessing && !inputValue.trim());

  return (
    <div
      className={`flex flex-col gap-2 p-2 md:p-3 bg-[var(--vscode-editor-background)] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.14)] ${
        className ?? ""
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <TextareaAutosize
          ref={textareaRef}
          className="w-full min-h-[40px] px-2.5 py-2 rounded bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] leading-normal resize-none overflow-y-auto outline-none transition-all placeholder:text-[var(--vscode-input-placeholderForeground)] focus:shadow-[0_0_0_1px_var(--vscode-focusBorder)] disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder="Type your message... (Ctrl+Enter to send)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          minRows={3}
          maxRows={15}
          autoFocus={true}
        />

        <div className="flex flex-nowrap gap-1.5 justify-end items-center">
          {isProcessing && (
            <div className="flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-badge-background)] rounded mr-auto">
              <span className="inline-block w-2 h-2 bg-[var(--vscode-charts-blue)] rounded-full animate-pulse"></span>
              AI is thinking...
            </div>
          )}
          {modeSelector && <div className="flex-shrink-0">{modeSelector}</div>}
          {onClear && (
            <button
              className="flex items-center justify-center h-8 w-8 rounded bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] cursor-pointer transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              onClick={onClear}
              disabled={isProcessing}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          )}

          <button
            className="flex items-center justify-center gap-1.5 h-8 px-3 rounded bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap hover:bg-[var(--vscode-button-hoverBackground)] active:translate-y-px disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handlePrimaryAction}
            disabled={isPrimaryDisabled}
            title={
              isProcessing ? "Cancel current task" : "Send message (Ctrl+Enter)"
            }
            aria-label={isProcessing ? "Cancel current task" : "Send message"}
          >
            {isProcessing ? (
              <>
                <Square
                  size={16}
                  strokeWidth={2}
                  className="translate-y-[0.5px]"
                />
                Cancel
              </>
            ) : (
              <>
                <Send
                  size={16}
                  strokeWidth={2}
                  className="translate-y-[0.5px]"
                />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
