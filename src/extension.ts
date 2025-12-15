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

  // 注册分析选中代码的命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "coding-agent-slim.analyzeSelectedCode",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const fileName = editor.document.fileName;
        const startLine = selection.start.line + 1;
        const endLine = selection.end.line + 1;

        const analysisPrompt = `${fileName}:${startLine}-${endLine}

\`\`\`
${selectedText}
\`\`\`
`;
        // 将分析提示发送到webview的输入框
        provider.setInputText(analysisPrompt);

        // 显示侧边栏
        vscode.commands.executeCommand(
          "coding-agent-slim.SidebarProvider.focus"
        );
      }
    )
  );
}

export function deactivate() {}
