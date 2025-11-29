import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium border-none rounded-sm cursor-pointer transition-all outline-none whitespace-nowrap select-none min-h-[28px] focus:outline-1 focus:outline-offset-2 focus-visible:outline-2 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'text-[var(--vscode-button-foreground)] bg-[var(--vscode-button-background)] hover:bg-[var(--vscode-button-hoverBackground)] focus:outline-[var(--vscode-focusBorder)] focus-visible:outline-[var(--vscode-focusBorder)]',
    secondary: 'text-[var(--vscode-button-secondaryForeground)] bg-[var(--vscode-button-secondaryBackground)] border border-[var(--vscode-button-border,transparent)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] focus:outline-[var(--vscode-focusBorder)] focus-visible:outline-[var(--vscode-focusBorder)]',
    danger: 'text-[var(--vscode-button-foreground,white)] bg-[var(--vscode-errorForeground,#f44747)] border border-[var(--vscode-inputValidation-errorBorder,transparent)] hover:opacity-90 hover:brightness-110 focus:outline-[var(--vscode-focusBorder)] focus-visible:outline-[var(--vscode-focusBorder)]',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${loading ? 'pointer-events-none' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      <span className={loading ? 'opacity-60' : ''}>{children}</span>
    </button>
  );
};
