import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { ApiConfiguration } from './apiHandler';

/**
 * ConfigurationUI provides user interface for configuring the plugin
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export class ConfigurationUI {
  constructor(private configManager: ConfigurationManager) {}

  /**
   * Show API configuration dialog
   * Requirements: 10.1, 10.2, 10.4, 10.5
   */
  async showApiConfigurationDialog(): Promise<void> {
    // Get current configuration
    const currentConfig = await this.configManager.getConfiguration();

    // Step 1: Get Base URL
    const baseUrl = await vscode.window.showInputBox({
      prompt: 'Enter API Base URL',
      value: currentConfig.api.baseUrl,
      placeHolder: 'https://api.siliconflow.cn/v1',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Base URL is required';
        }
        try {
          new URL(value);
          return null;
        } catch {
          return 'Invalid URL format';
        }
      },
    });

    if (baseUrl === undefined) {
      return; // User cancelled
    }

    // Step 2: Get Model Name
    const model = await vscode.window.showInputBox({
      prompt: 'Enter Model Name',
      value: currentConfig.api.model,
      placeHolder: 'gpt-4',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'Model name is required';
        }
        return null;
      },
    });

    if (model === undefined) {
      return; // User cancelled
    }

    // Step 3: Get API Key (Requirement 10.2 - Secure storage)
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API Key',
      password: true,
      placeHolder: 'sk-...',
      validateInput: (value) => {
        if (!value || value.trim() === '') {
          return 'API key is required';
        }
        return null;
      },
    });

    if (apiKey === undefined) {
      return; // User cancelled
    }

    // Step 4: Get Temperature (optional)
    const temperatureStr = await vscode.window.showInputBox({
      prompt: 'Enter Temperature (0-2, optional)',
      value: currentConfig.api.temperature?.toString() || '0.7',
      placeHolder: '0.7',
      validateInput: (value) => {
        if (value && value.trim() !== '') {
          const temp = parseFloat(value);
          if (isNaN(temp) || temp < 0 || temp > 2) {
            return 'Temperature must be between 0 and 2';
          }
        }
        return null;
      },
    });

    if (temperatureStr === undefined) {
      return; // User cancelled
    }

    const temperature = temperatureStr ? parseFloat(temperatureStr) : 0.7;

    // Step 5: Get Max Tokens (optional)
    const maxTokensStr = await vscode.window.showInputBox({
      prompt: 'Enter Max Tokens (optional)',
      value: currentConfig.api.maxTokens?.toString() || '4096',
      placeHolder: '4096',
      validateInput: (value) => {
        if (value && value.trim() !== '') {
          const tokens = parseInt(value, 10);
          if (isNaN(tokens) || tokens < 1) {
            return 'Max tokens must be at least 1';
          }
        }
        return null;
      },
    });

    if (maxTokensStr === undefined) {
      return; // User cancelled
    }

    const maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : 4096;

    // Build API configuration
    const apiConfig: ApiConfiguration = {
      baseUrl,
      model,
      apiKey,
      temperature,
      maxTokens,
    };

    // Validate configuration (Requirements 10.3, 10.4)
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Validating API configuration...',
        cancellable: false,
      },
      async () => {
        const validation = await this.configManager.validateApiConfiguration(apiConfig);

        if (!validation.valid) {
          vscode.window.showErrorMessage(
            `Configuration validation failed: ${validation.error}`
          );
          return;
        }

        // Save configuration
        await this.configManager.updateApiConfiguration(apiConfig);

        vscode.window.showInformationMessage(
          'API configuration saved and validated successfully!'
        );
      }
    );
  }

  /**
   * Show permission settings dialog
   * Requirement: 10.3
   */
  async showPermissionSettingsDialog(): Promise<void> {
    const currentConfig = await this.configManager.getConfiguration();

    // Show quick pick for permission settings
    const options = [
      {
        label: '$(file) Allow Read by Default',
        description: currentConfig.permissions.allowReadByDefault ? 'Currently: Yes' : 'Currently: No',
        picked: currentConfig.permissions.allowReadByDefault,
        key: 'allowReadByDefault',
      },
      {
        label: '$(edit) Allow Write by Default',
        description: currentConfig.permissions.allowWriteByDefault ? 'Currently: Yes' : 'Currently: No',
        picked: currentConfig.permissions.allowWriteByDefault,
        key: 'allowWriteByDefault',
      },
      {
        label: '$(terminal) Allow Execute by Default',
        description: currentConfig.permissions.allowExecuteByDefault ? 'Currently: Yes' : 'Currently: No',
        picked: currentConfig.permissions.allowExecuteByDefault,
        key: 'allowExecuteByDefault',
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      title: 'Configure Permission Settings',
      placeHolder: 'Select permissions to toggle',
      canPickMany: true,
    });

    if (selected === undefined) {
      return; // User cancelled
    }

    // Update permissions based on selection
    const newPermissions = {
      allowReadByDefault: selected.some((s) => s.key === 'allowReadByDefault'),
      allowWriteByDefault: selected.some((s) => s.key === 'allowWriteByDefault'),
      allowExecuteByDefault: selected.some((s) => s.key === 'allowExecuteByDefault'),
    };

    await this.configManager.updatePermissionSettings(newPermissions);

    vscode.window.showInformationMessage('Permission settings updated successfully!');
  }

  /**
   * Show quick configuration menu
   * Requirements: 10.1, 10.2, 10.3
   */
  async showConfigurationMenu(): Promise<void> {
    const options = [
      {
        label: '$(key) Configure API',
        description: 'Set API endpoint, model, and key',
        action: 'api',
      },
      {
        label: '$(shield) Configure Permissions',
        description: 'Set default permission settings',
        action: 'permissions',
      },
      {
        label: '$(testing-view-icon) Test API Connection',
        description: 'Validate current API configuration',
        action: 'test',
      },
      {
        label: '$(trash) Clear API Key',
        description: 'Remove stored API key',
        action: 'clear',
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      title: 'Coding Agent Configuration',
      placeHolder: 'Select configuration option',
    });

    if (!selected) {
      return; // User cancelled
    }

    switch (selected.action) {
      case 'api':
        await this.showApiConfigurationDialog();
        break;
      case 'permissions':
        await this.showPermissionSettingsDialog();
        break;
      case 'test':
        await this.testApiConnection();
        break;
      case 'clear':
        await this.clearApiKey();
        break;
    }
  }

  /**
   * Test API connection
   * Requirement: 10.4
   */
  private async testApiConnection(): Promise<void> {
    const config = await this.configManager.getConfiguration();

    if (!config.api.apiKey) {
      vscode.window.showWarningMessage('API key is not configured. Please configure API first.');
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Testing API connection...',
        cancellable: false,
      },
      async () => {
        const validation = await this.configManager.validateApiConfiguration(config.api);

        if (validation.valid) {
          vscode.window.showInformationMessage('✓ API connection successful!');
        } else {
          vscode.window.showErrorMessage(`✗ API connection failed: ${validation.error}`);
        }
      }
    );
  }

  /**
   * Clear API key
   * Requirement: 10.2
   */
  private async clearApiKey(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'Are you sure you want to clear the stored API key?',
      { modal: true },
      'Yes',
      'No'
    );

    if (result === 'Yes') {
      await this.configManager.deleteApiKey();
      vscode.window.showInformationMessage('API key cleared successfully.');
    }
  }
}
