import * as vscode from 'vscode';
import { ApiConfiguration } from './apiHandler';
import { PermissionSettings } from './PermissionManager';
import { WorkMode } from './ModeManager';

/**
 * Complete plugin configuration
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export interface PluginConfiguration {
  /**
   * API configuration
   * Requirements: 10.1, 10.2
   */
  api: ApiConfiguration;

  /**
   * Permission settings
   * Requirement: 10.3
   */
  permissions: PermissionSettings;

  /**
   * Default work mode
   */
  defaultMode: WorkMode;

  /**
   * Maximum ReAct loop iterations
   */
  maxLoopCount: number;

  /**
   * Maximum context window size
   */
  contextWindowSize: number;
}

/**
 * ConfigurationManager handles reading, saving, and validating plugin configuration
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'codingAgent';
  private static readonly API_KEY_SECRET = 'codingAgent.apiKey';

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Get complete plugin configuration
   * Requirements: 10.1, 10.2, 10.3
   * 
   * @returns Promise<PluginConfiguration> Complete configuration
   */
  async getConfiguration(): Promise<PluginConfiguration> {
    const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
    
    // Get API key from secure storage (Requirement 10.2)
    const apiKey = await this.getApiKey();

    return {
      api: {
        baseUrl: config.get<string>('api.baseUrl', 'https://api.openai.com/v1'),
        model: config.get<string>('api.model', 'gpt-4'),
        apiKey: apiKey || '',
        temperature: config.get<number>('api.temperature', 0.7),
        maxTokens: config.get<number>('api.maxTokens', 4096),
      },
      permissions: {
        allowReadByDefault: config.get<boolean>('permissions.allowReadByDefault', true),
        allowWriteByDefault: config.get<boolean>('permissions.allowWriteByDefault', false),
        allowExecuteByDefault: config.get<boolean>('permissions.allowExecuteByDefault', false),
        alwaysConfirm: config.get<string[]>('permissions.alwaysConfirm', ['delete', 'execute']),
      },
      defaultMode: config.get<WorkMode>('defaultMode', 'code'),
      maxLoopCount: config.get<number>('maxLoopCount', 25),
      contextWindowSize: config.get<number>('contextWindowSize', 100000),
    };
  }

  /**
   * Get API key from secure storage
   * Requirement: 10.2 - Use VSCode SecretStorage for API keys
   * 
   * @returns Promise<string | undefined> API key or undefined if not set
   */
  async getApiKey(): Promise<string | undefined> {
    return await this.context.secrets.get(ConfigurationManager.API_KEY_SECRET);
  }

  /**
   * Store API key in secure storage
   * Requirement: 10.2 - Use VSCode SecretStorage for API keys
   * 
   * @param apiKey API key to store
   */
  async setApiKey(apiKey: string): Promise<void> {
    await this.context.secrets.store(ConfigurationManager.API_KEY_SECRET, apiKey);
    console.log('[ConfigurationManager] API key stored securely');
  }

  /**
   * Delete API key from secure storage
   * Requirement: 10.2
   */
  async deleteApiKey(): Promise<void> {
    await this.context.secrets.delete(ConfigurationManager.API_KEY_SECRET);
    console.log('[ConfigurationManager] API key deleted');
  }

  /**
   * Update API configuration
   * Requirements: 10.1, 10.4
   * 
   * @param apiConfig Partial API configuration to update
   */
  async updateApiConfiguration(apiConfig: Partial<ApiConfiguration>): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);

    if (apiConfig.baseUrl !== undefined) {
      await config.update('api.baseUrl', apiConfig.baseUrl, vscode.ConfigurationTarget.Global);
    }
    if (apiConfig.model !== undefined) {
      await config.update('api.model', apiConfig.model, vscode.ConfigurationTarget.Global);
    }
    if (apiConfig.temperature !== undefined) {
      await config.update('api.temperature', apiConfig.temperature, vscode.ConfigurationTarget.Global);
    }
    if (apiConfig.maxTokens !== undefined) {
      await config.update('api.maxTokens', apiConfig.maxTokens, vscode.ConfigurationTarget.Global);
    }
    if (apiConfig.apiKey !== undefined) {
      await this.setApiKey(apiConfig.apiKey);
    }

    console.log('[ConfigurationManager] API configuration updated');
  }

  /**
   * Update permission settings
   * Requirement: 10.3
   * 
   * @param permissions Partial permission settings to update
   */
  async updatePermissionSettings(permissions: Partial<PermissionSettings>): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);

    if (permissions.allowReadByDefault !== undefined) {
      await config.update('permissions.allowReadByDefault', permissions.allowReadByDefault, vscode.ConfigurationTarget.Global);
    }
    if (permissions.allowWriteByDefault !== undefined) {
      await config.update('permissions.allowWriteByDefault', permissions.allowWriteByDefault, vscode.ConfigurationTarget.Global);
    }
    if (permissions.allowExecuteByDefault !== undefined) {
      await config.update('permissions.allowExecuteByDefault', permissions.allowExecuteByDefault, vscode.ConfigurationTarget.Global);
    }
    if (permissions.alwaysConfirm !== undefined) {
      await config.update('permissions.alwaysConfirm', permissions.alwaysConfirm, vscode.ConfigurationTarget.Global);
    }

    console.log('[ConfigurationManager] Permission settings updated');
  }

  /**
   * Update default mode
   * 
   * @param mode Default work mode
   */
  async updateDefaultMode(mode: WorkMode): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
    await config.update('defaultMode', mode, vscode.ConfigurationTarget.Global);
    console.log(`[ConfigurationManager] Default mode updated to: ${mode}`);
  }

  /**
   * Update max loop count
   * 
   * @param count Maximum loop count
   */
  async updateMaxLoopCount(count: number): Promise<void> {
    const config = vscode.workspace.getConfiguration(ConfigurationManager.CONFIG_SECTION);
    await config.update('maxLoopCount', count, vscode.ConfigurationTarget.Global);
    console.log(`[ConfigurationManager] Max loop count updated to: ${count}`);
  }

  /**
   * Validate API configuration
   * Requirements: 10.3, 10.4 - Validate configuration and test API connection
   * 
   * @param apiConfig API configuration to validate
   * @returns Promise<{ valid: boolean; error?: string }> Validation result
   */
  async validateApiConfiguration(apiConfig: ApiConfiguration): Promise<{ valid: boolean; error?: string }> {
    // Check required fields
    if (!apiConfig.baseUrl || apiConfig.baseUrl.trim() === '') {
      return { valid: false, error: 'Base URL is required' };
    }

    if (!apiConfig.model || apiConfig.model.trim() === '') {
      return { valid: false, error: 'Model name is required' };
    }

    if (!apiConfig.apiKey || apiConfig.apiKey.trim() === '') {
      return { valid: false, error: 'API key is required' };
    }

    // Validate URL format
    try {
      new URL(apiConfig.baseUrl);
    } catch (error) {
      return { valid: false, error: 'Invalid base URL format' };
    }

    // Validate temperature range
    if (apiConfig.temperature !== undefined) {
      if (apiConfig.temperature < 0 || apiConfig.temperature > 2) {
        return { valid: false, error: 'Temperature must be between 0 and 2' };
      }
    }

    // Validate maxTokens
    if (apiConfig.maxTokens !== undefined) {
      if (apiConfig.maxTokens < 1) {
        return { valid: false, error: 'Max tokens must be at least 1' };
      }
    }

    // Test API connection (Requirement 10.4)
    try {
      const { ApiHandler } = await import('./apiHandler');
      const apiHandler = new ApiHandler(apiConfig);
      const isValid = await apiHandler.validateConfiguration();
      
      if (!isValid) {
        return { valid: false, error: 'API connection test failed. Please check your credentials.' };
      }

      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `API validation error: ${errorMessage}` };
    }
  }

  /**
   * Check if API is configured
   * Requirement: 10.5 - Prompt user if not configured
   * 
   * @returns Promise<boolean> True if API is configured
   */
  async isApiConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return apiKey !== undefined && apiKey.trim() !== '';
  }

  /**
   * Prompt user to configure API if not configured
   * Requirement: 10.5
   */
  async promptConfigureApiIfNeeded(): Promise<boolean> {
    const isConfigured = await this.isApiConfigured();
    
    if (!isConfigured) {
      const result = await vscode.window.showWarningMessage(
        'Coding Agent is not configured. Please configure your API settings.',
        'Configure Now',
        'Later'
      );

      if (result === 'Configure Now') {
        await vscode.commands.executeCommand('coding-agent-slim.configureApi');
        // Check again after configuration
        return await this.isApiConfigured();
      }

      return false;
    }

    return true;
  }

  /**
   * Listen for configuration changes
   * 
   * @param callback Callback to invoke when configuration changes
   * @returns Disposable to stop listening
   */
  onConfigurationChanged(callback: (config: PluginConfiguration) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration(ConfigurationManager.CONFIG_SECTION)) {
        const config = await this.getConfiguration();
        callback(config);
      }
    });
  }
}
