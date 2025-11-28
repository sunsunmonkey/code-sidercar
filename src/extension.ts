import * as vscode from "vscode";
import { AgentWebviewProvider } from "./AgentWebviewProvider";
import { ConfigurationUI } from "./ConfigurationUI";

export function activate(context: vscode.ExtensionContext) {
  const provider = new AgentWebviewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "coding-agent-slim.SidebarProvider",
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("coding-agent-slim.helloWorld", () => {
      provider.postMessage("hello world");
    })
  );

  // Register configuration command (Requirements: 10.1, 10.2, 10.3, 10.4, 10.5)
  const configUI = new ConfigurationUI(provider.getConfigurationManager());
  context.subscriptions.push(
    vscode.commands.registerCommand("coding-agent-slim.configureApi", async () => {
      await configUI.showConfigurationMenu();
    })
  );
}

export function deactivate() {}
