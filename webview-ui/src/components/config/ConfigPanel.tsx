/**
 * ConfigPanel component
 * Main configuration panel that combines all configuration sections
 */

import React from 'react';
import { useConfiguration } from '../../hooks/useConfiguration';
import { ApiConfigSection } from './ApiConfigSection';
import { PermissionsSection } from './PermissionsSection';
import { AdvancedSection } from './AdvancedSection';
import { ConfigActions } from './ConfigActions';

/**
 * ConfigPanel component
 * Combines all configuration sections and manages overall state
 */
export const ConfigPanel: React.FC = () => {
  const {
    config,
    validationErrors,
    isLoading,
    isSaving,
    isTesting,
    testResult,
    isFirstTime,
    updateApiConfig,
    updatePermissions,
    updateAdvanced,
    saveConfiguration,
    testConnection,
  } = useConfiguration();

  // Show loading state while configuration is being loaded
  if (isLoading || !config) {
    return (
      <div className="flex flex-col h-full w-full overflow-y-auto bg-(--vscode-sideBar-background)">
        <div className="flex items-center justify-center h-full text-sm text-(--vscode-foreground) opacity-70">
          Loading configuration...
        </div>
      </div>
    );
  }

  // Check if there are any validation errors
  const hasValidationErrors = Object.values(validationErrors).some(
    error => error !== undefined
  );

  /**
   * Handle API configuration field changes
   */
  const handleApiChange = (field: string, value: string | number) => {
    updateApiConfig(field as keyof typeof config.api, value);
  };

  /**
   * Handle permissions field changes
   */
  const handlePermissionsChange = (field: string, value: boolean) => {
    updatePermissions(field as keyof typeof config.permissions, value);
  };

  /**
   * Handle advanced configuration field changes
   */
  const handleAdvancedChange = (field: string, value: string | number) => {
    updateAdvanced(field as keyof typeof config.advanced, value);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-(--vscode-sideBar-background) [&_*:focus-visible]:outline-1 [&_*:focus-visible]:outline-offset-2 [&_*:focus-visible]:outline-[var(--vscode-focusBorder)]">
      <div className="flex flex-col flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6 gap-4">
        <header className="rounded-xl bg-(--vscode-editor-background) px-5 py-4 md:px-6 md:py-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] shrink-0">
          <h1 className="text-xl font-semibold text-(--vscode-foreground) m-0 mb-2">
            Configuration
          </h1>
          <p className="text-[13px] text-(--vscode-descriptionForeground) m-0 leading-normal">
            {isFirstTime 
              ? 'Welcome! Let\'s set up your AI Coding Assistant to get started.'
              : 'Configure your AI Coding Assistant settings'
            }
          </p>
        </header>

        {isFirstTime && (
          <div className="m-0 rounded-xl bg-(--vscode-editor-background) shadow-[0_8px_22px_rgba(0,0,0,0.16)] p-5 md:p-6">
            <div>
              <h2 className="text-base font-semibold text-[var(--vscode-foreground)] m-0 mb-3">
                Quick Setup
              </h2>
              <p className="text-[13px] text-[var(--vscode-foreground)] m-0 mb-3 leading-normal">
                To get started, you'll need to configure your API settings.
                The required fields are marked with an asterisk (*).
              </p>
              <ol className="m-0 pl-5 text-[13px] text-[var(--vscode-foreground)] leading-relaxed list-decimal [&_li]:mb-1">
                <li>Enter your API Base URL and Model name</li>
                <li>Provide your API Key (stored securely)</li>
                <li>Test the connection to verify your settings</li>
                <li>Save your configuration</li>
              </ol>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-4 md:gap-5 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[var(--vscode-scrollbarSlider-background)] [&::-webkit-scrollbar-thumb]:bg-[var(--vscode-scrollbarSlider-background)] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-[var(--vscode-scrollbarSlider-hoverBackground)] [&::-webkit-scrollbar-thumb:active]:bg-[var(--vscode-scrollbarSlider-activeBackground)] pb-2">
          <ApiConfigSection
            config={config.api}
            onChange={handleApiChange}
            errors={validationErrors}
            isFirstTime={isFirstTime}
          />

          <PermissionsSection
            permissions={config.permissions}
            onChange={handlePermissionsChange}
          />

          <AdvancedSection
            advanced={config.advanced}
            onChange={handleAdvancedChange}
            errors={validationErrors}
          />

          <ConfigActions
            onSave={saveConfiguration}
            onTestConnection={testConnection}
            isSaving={isSaving}
            isTesting={isTesting}
            hasValidationErrors={hasValidationErrors}
            testResult={testResult}
          />
        </div>
      </div>
    </div>
  );
};
