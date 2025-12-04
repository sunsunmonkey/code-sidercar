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
}

export function deactivate() {}
