import React, { useState } from 'react';
import type { ToolUse, ToolResult } from '../types';
import './ToolCallDisplay.css';

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
    <div className="tool-call-container">
      {/* Tool Call Section */}
      <div className="tool-call">
        <div 
          className="tool-call-header"
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
          <span className="tool-icon" title="Tool">{icon}</span>
          <span className="tool-name">{toolCall.name}</span>
          <span className="tool-badge">Tool Call</span>
          <span className="tool-expand">{isExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isExpanded && (
          <div className="tool-call-details">
            <div className="tool-params-label">Parameters:</div>
            <div className="tool-params-content">
              {Object.keys(toolCall.params).length === 0 ? (
                <div className="tool-params-empty">No parameters</div>
              ) : (
                <table className="tool-params-table">
                  <tbody>
                    {Object.entries(toolCall.params).map(([key, value]) => (
                      <tr key={key}>
                        <td className="param-key">{key}</td>
                        <td className="param-value">
                          <code>{formatParamValue(value)}</code>
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
    <div className={`tool-result ${isError ? 'tool-result-error' : 'tool-result-success'}`}>
      <div 
        className="tool-result-header"
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
        <span className="tool-icon" title={isError ? 'Error' : 'Success'}>
          {isError ? '❌' : '✅'}
        </span>
        <span className="tool-name">{result.tool_name}</span>
        <span className={`tool-status ${isError ? 'status-error' : 'status-success'}`}>
          {isError ? 'Error' : 'Success'}
        </span>
        <span className="tool-expand">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="tool-result-details">
          <div className="tool-result-label">Result:</div>
          <div className="tool-result-content">
            <pre>{result.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
