import React from 'react';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  const toggleClasses = `relative w-10 h-5 border-none rounded-full cursor-pointer transition-all p-0 outline-none flex-shrink-0 focus:outline-1 focus:outline-offset-2 focus-visible:outline-2 focus:outline-[var(--vscode-focusBorder)] focus-visible:outline-[var(--vscode-focusBorder)] disabled:opacity-50 disabled:cursor-not-allowed ${
    checked
      ? 'bg-[var(--vscode-button-background)] border border-[var(--vscode-button-background)] hover:bg-[var(--vscode-button-hoverBackground)] hover:border-[var(--vscode-button-hoverBackground)]'
      : 'bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border,var(--vscode-panel-border))] hover:bg-[var(--vscode-inputOption-hoverBackground,var(--vscode-input-background))] hover:border-[var(--vscode-inputOption-activeBorder,var(--vscode-focusBorder))]'
  }`;

  return (
    <div className="flex items-center justify-between mb-3 py-2 gap-3">
      <label className="text-[13px] text-[var(--vscode-foreground)] flex-1 select-none leading-snug">
        {label}
      </label>
      <button
        className={toggleClasses}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        type="button"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-200 ease-in-out shadow-[0_1px_3px_rgba(0,0,0,0.3)] ${
            checked
              ? 'translate-x-5 bg-[var(--vscode-button-foreground)]'
              : 'translate-x-0 bg-[var(--vscode-foreground)]'
          }`}
        />
      </button>
    </div>
  );
};
