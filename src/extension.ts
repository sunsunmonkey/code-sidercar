import * as vscode from "vscode";
import { AgentWebviewProvider } from "./ui/AgentWebviewProvider";

export async function activate(context: vscode.ExtensionContext) {
  const provider = new AgentWebviewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "coding-agent-slim.SidebarProvider",
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "coding-agent-slim.configureApi",
      async () => {
        await vscode.commands.executeCommand(
          "coding-agent-slim.openConfiguration"
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "coding-agent-slim.openConfiguration",
      () => {
        vscode.commands.executeCommand(
          "coding-agent-slim.SidebarProvider.focus"
        );
        provider.navigateToConfig();
      }
    )
  );

  await checkAndShowSetupWizard(provider.getConfigurationManager());
}

/**
 * Check if API is configured and automatically open configuration interface if not
 *
 *
 * @param context Extension context
 * @param configManager Configuration manager instance
 */
async function checkAndShowSetupWizard(configManager: any): Promise<void> {
  try {
    // Check if this is the first activation (no API key configured)
    const isConfigured = await configManager.isApiConfigured();

    if (!isConfigured) {
      // Show welcome message and automatically open configuration interface
      const result = await vscode.window.showInformationMessage(
        "Welcome to AI Coding Assistant! Let's get you set up.",
        "Configure Now",
        "Later"
      );

      if (result === "Configure Now") {
        // Open the configuration webview
        await vscode.commands.executeCommand(
          "coding-agent-slim.openConfiguration"
        );
      }
    }
  } catch (error) {
    console.error("[Extension] Failed to check configuration status:", error);
  }
}

export function deactivate() {}
