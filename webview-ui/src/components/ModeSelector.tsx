import React, { useState, useRef, useEffect } from 'react';
import type { WorkMode } from '../types';
import './ModeSelector.css';

interface ModeSelectorProps {
  currentMode: WorkMode;
  onModeChange: (mode: WorkMode) => void;
}

interface ModeOption {
  id: WorkMode;
  name: string;
  description: string;
  icon: string;
}

/**
 * ModeSelector component for switching between work modes
 * Requirements: 7.5, 7.6
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mode definitions matching ModeManager.ts
  const modes: ModeOption[] = [
    {
      id: 'architect',
      name: 'Architect',
      description: '架构设计和规划',
      icon: '🏗️',
    },
    {
      id: 'code',
      name: 'Code',
      description: '代码编写和重构',
      icon: '💻',
    },
    {
      id: 'ask',
      name: 'Ask',
      description: '解释和文档',
      icon: '❓',
    },
    {
      id: 'debug',
      name: 'Debug',
      description: '调试和问题诊断',
      icon: '🪲',
    },
  ];

  const currentModeOption = modes.find(m => m.id === currentMode) || modes[1]; // Default to 'code'

  /**
   * Handle mode selection
   * Requirement 7.5: Switch work mode
   */
  const handleModeSelect = (mode: WorkMode) => {
    if (mode !== currentMode) {
      onModeChange(mode);
    }
    setIsOpen(false);
  };

  /**
   * Toggle dropdown
   */
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="mode-selector" ref={dropdownRef}>
      <button
        className="mode-selector-button"
        onClick={toggleDropdown}
        aria-label="Select work mode"
        aria-expanded={isOpen}
      >
        <span className="mode-icon">{currentModeOption.icon}</span>
        <span className="mode-name">{currentModeOption.name}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="mode-dropdown">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={`mode-option ${mode.id === currentMode ? 'active' : ''}`}
              onClick={() => handleModeSelect(mode.id)}
              aria-label={`Switch to ${mode.name} mode`}
            >
              <span className="mode-option-icon">{mode.icon}</span>
              <div className="mode-option-content">
                <span className="mode-option-name">{mode.name}</span>
                <span className="mode-option-description">{mode.description}</span>
              </div>
              {mode.id === currentMode && (
                <span className="mode-option-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
