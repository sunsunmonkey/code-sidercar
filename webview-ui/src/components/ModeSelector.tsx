import React, { useState, useRef, useEffect } from "react";
import type { WorkMode } from "../types/messages";

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
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mode definitions matching ModeManager.ts
  const modes: ModeOption[] = [
    {
      id: "architect",
      name: "Architect",
      description: "架构设计和规划",
      icon: "🏗️",
    },
    {
      id: "code",
      name: "Code",
      description: "代码编写和重构",
      icon: "💻",
    },
    {
      id: "ask",
      name: "Ask",
      description: "解释和文档",
      icon: "❓",
    },
    {
      id: "debug",
      name: "Debug",
      description: "调试和问题诊断",
      icon: "🪲",
    },
  ];

  const currentModeOption = modes.find((m) => m.id === currentMode) || modes[1]; // Default to 'code'

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2 border border-[var(--vscode-input-border)] rounded bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] cursor-pointer transition-all outline-none hover:bg-[var(--vscode-list-hoverBackground)] hover:border-[var(--vscode-focusBorder)] focus:border-[var(--vscode-focusBorder)] focus:shadow-[0_0_0_1px_var(--vscode-focusBorder)]"
        onClick={toggleDropdown}
        aria-label="Select work mode"
        aria-expanded={isOpen}
      >
        <span className="text-lg leading-none flex-shrink-0">
          {currentModeOption.icon}
        </span>
        <span className="flex-1 text-left font-medium">
          {currentModeOption.name}
        </span>
        <span
          className={`text-[10px] flex-shrink-0 text-[var(--vscode-descriptionForeground)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[1000] bg-[var(--vscode-dropdown-background)] border border-[var(--vscode-dropdown-border)] rounded shadow-[var(--vscode-widget-shadow)] overflow-hidden animate-[slideDown_0.15s_ease-out]">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-none bg-transparent text-[var(--vscode-dropdown-foreground)] cursor-pointer transition-colors text-left hover:bg-[var(--vscode-list-hoverBackground)] max-[400px]:px-3 max-[400px]:py-3 ${
                mode.id === currentMode
                  ? "bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]"
                  : ""
              }`}
              onClick={() => handleModeSelect(mode.id)}
              aria-label={`Switch to ${mode.name} mode`}
            >
              <span className="text-xl leading-none flex-shrink-0 max-[400px]:text-lg">
                {mode.icon}
              </span>
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                <span className="font-medium leading-tight">{mode.name}</span>
                <span
                  className={`text-[11px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-[400px]:text-[10px] ${
                    mode.id === currentMode
                      ? "text-[var(--vscode-list-activeSelectionForeground)] opacity-80"
                      : "text-[var(--vscode-descriptionForeground)]"
                  }`}
                >
                  {mode.description}
                </span>
              </div>
              {mode.id === currentMode && (
                <span className="text-sm text-[var(--vscode-list-activeSelectionForeground)] flex-shrink-0">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
