import React, { useState } from 'react';
import type { ToolUse, ToolResult } from '../types';

/**
 * ToolCallDisplay component shows a tool call with its parameters
 * Requirements: 14.1, 14.2, 14.4, 14.5
 */
interface ToolCallDisplayProps {
  toolCall: ToolUse;
  result?: ToolResult;
}

/**
 * Get icon for specific tool types
 */
const getToolIcon = (toolName: string): string => {
  const iconMap: Record<string, string> = {
    'read_file': '📖',
    'write_file': '✍️',
    'list_directory': '📁',
    'search_files': '🔍',
    'execute_command': '⚡',
    'get_diagnostics': '🔬',
    'apply_diff': '📝',
    'insert_content': '➕',
    'list_code_definition_names': '🏗️',
    'attempt_completion': '✅',
  };
  
  return iconMap[toolName] || '🔧';
};

/**
 * Format parameter value for display
 */
const formatParamValue = (value: any): string => {
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value;
  }
  return JSON.stringify(value);
};

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall, result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const icon = getToolIcon(toolCall.name);

  return (
    <div className="mt-3 flex flex-col gap-2">
      {/* Tool Call Section */}
      <div className="rounded-md overflow-hidden border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)]">
        <div 
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[var(--vscode-list-hoverBackground)] cursor-pointer select-none transition-colors hover:bg-[var(--vscode-list-activeSelectionBackground)] focus:outline-1 focus:outline-[var(--vscode-focusBorder)] focus:-outline-offset-1"
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <span className="text-lg leading-none flex-shrink-0" title="Tool">{icon}</span>
          <span className="flex-1 font-semibold text-[var(--vscode-foreground)] text-sm">{toolCall.name}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] font-medium uppercase tracking-wide">
            Tool Call
          </span>
          <span className="text-[10px] text-[var(--vscode-descriptionForeground)] flex-shrink-0 transition-transform">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
        
        {isExpanded && (
          <div className="px-3.5 py-3.5 bg-[var(--vscode-editor-background)] border-t border-[var(--vscode-panel-border)]">
            <div className="text-xs font-semibold text-[var(--vscode-descriptionForeground)] mb-2 uppercase tracking-wide">
              Parameters:
            </div>
            <div className="bg-[var(--vscode-textCodeBlock-background)] rounded p-2.5">
              {Object.keys(toolCall.params).length === 0 ? (
                <div className="text-[var(--vscode-descriptionForeground)] italic text-[13px]">No parameters</div>
              ) : (
                <table className="w-full border-collapse text-[13px]">
                  <tbody>
                    {Object.entries(toolCall.params).map(([key, value]) => (
                      <tr key={key} className="border-b border-[var(--vscode-panel-border)] last:border-b-0">
                        <td className="py-1.5 pr-2 font-semibold text-[var(--vscode-symbolIcon-variableForeground)] align-top w-[30%] min-w-[100px]">
                          {key}
                        </td>
                        <td className="py-1.5 pl-2 text-[var(--vscode-foreground)] break-words">
                          <code className="bg-transparent p-0 text-[var(--vscode-textPreformat-foreground)] whitespace-pre-wrap break-words">
                            {formatParamValue(value)}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tool Result Section (if available) */}
      {result && (
        <ToolResultDisplay result={result} />
      )}
    </div>
  );
};

/**
 * ToolResultDisplay component shows the result of a tool execution
 * Requirements: 14.1, 14.3, 14.4, 14.5
 */
interface ToolResultDisplayProps {
  result: ToolResult;
}

const ToolResultDisplay: React.FC<ToolResultDisplayProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isError = result.is_error;

  return (
    <div className={`rounded-md overflow-hidden border border-[var(--vscode-panel-border)] ${
      isError ? '' : ''
    }`}>
      <div 
        className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer select-none transition-colors focus:outline-1 focus:outline-[var(--vscode-focusBorder)] focus:-outline-offset-1 ${
          isError 
            ? 'bg-[var(--vscode-inputValidation-errorBackground)] border-l-[3px] border-l-[var(--vscode-testing-iconFailed)] hover:bg-[var(--vscode-list-errorHoverBackground)]'
            : 'bg-[var(--vscode-inputValidation-infoBackground)] border-l-[3px] border-l-[var(--vscode-testing-iconPassed)] hover:bg-[var(--vscode-list-hoverBackground)]'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <span className="text-lg leading-none flex-shrink-0" title={isError ? 'Error' : 'Success'}>
          {isError ? '❌' : '✅'}
        </span>
        <span className="flex-1 font-semibold text-[var(--vscode-foreground)] text-sm">{result.tool_name}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
          isError 
            ? 'bg-[var(--vscode-inputValidation-errorBackground)] text-[var(--vscode-testing-iconFailed)]'
            : 'bg-[var(--vscode-inputValidation-infoBackground)] text-[var(--vscode-testing-iconPassed)]'
        }`}>
          {isError ? 'Error' : 'Success'}
        </span>
        <span className="text-[10px] text-[var(--vscode-descriptionForeground)] flex-shrink-0 transition-transform">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="px-3.5 py-3.5 bg-[var(--vscode-editor-background)] border-t border-[var(--vscode-panel-border)]">
          <div className="text-xs font-semibold text-[var(--vscode-descriptionForeground)] mb-2 uppercase tracking-wide">
            Result:
          </div>
          <div className="bg-[var(--vscode-textCodeBlock-background)] rounded p-2.5 max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[var(--vscode-scrollbarSlider-background)] [&::-webkit-scrollbar-thumb]:bg-[var(--vscode-scrollbarSlider-hoverBackground)] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[var(--vscode-scrollbarSlider-activeBackground)]">
            <pre className="m-0 text-[13px] whitespace-pre-wrap break-words text-[var(--vscode-foreground)] leading-normal">
              {result.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
