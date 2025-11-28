import React, { useEffect, useRef } from 'react';
import { Message } from './Message';
import type { DisplayMessage } from '../types';
import './MessageList.css';

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
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No messages yet</h3>
          <p>Start a conversation by typing a message below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
