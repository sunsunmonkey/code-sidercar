/**
 * ConfigApp component
 * Root component for the configuration interface
 * Requirements: 1.1
 */

import { ConfigPanel } from "./components/config/ConfigPanel";

/**
 * ConfigApp component
 * Entry point for the configuration webview application
 */
function ConfigApp({ onNavigateBack }: { onNavigateBack: () => void }) {
  return (
    <div className="flex flex-col h-screen w-full">
      <div className="flex items-center gap-3 p-3 bg-[var(--vscode-sideBar-background)] border-b border-[var(--vscode-panel-border)] flex-shrink-0">
        <button
          className="bg-transparent border border-[var(--vscode-button-border,transparent)] text-[var(--vscode-button-foreground)] px-3 py-1 cursor-pointer rounded-sm text-sm transition-colors hover:bg-[var(--vscode-button-hoverBackground)]"
          onClick={onNavigateBack}
          title="Back to Chat"
        >
          ← Back
        </button>
        <h2 className="m-0 text-base font-semibold">Configuration</h2>
      </div>
      <ConfigPanel />
    </div>
  );
}

export default ConfigApp;
