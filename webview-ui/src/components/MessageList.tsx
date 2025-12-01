import React, { useEffect, useRef } from "react";
import { Message } from "./Message";
import type { DisplayMessage } from "../types/messages";

interface MessageListProps {
  messages: DisplayMessage[];
}

/**
 * MessageList component displays all messages and auto-scrolls to the latest
 * Requirements: 4.1, 4.2, 9.3
 */
export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // Requirement 4.2: Keep interface scrolled to latest content
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-[var(--vscode-descriptionForeground)]">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="m-0 mb-2 text-[var(--vscode-foreground)] text-lg font-semibold">
            No messages yet
          </h3>
          <p className="m-0 text-sm">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    );
  }
  console.log(messages);
  return (
    <div
      className="flex-1 overflow-y-auto p-4 flex flex-col"
      ref={containerRef}
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
