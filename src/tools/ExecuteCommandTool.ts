import * as vscode from "vscode";
import * as path from "path";
import { BaseTool, ParameterDefinition } from "./Tool";

/**
 * ExecuteCommandTool - executes terminal commands in VS Code terminal
 *
 * This tool executes shell commands directly in VS Code's native terminal,
 * providing users with the same experience as running commands manually.
 * Uses Shell Integration API to capture command output.
 * This tool requires user permission before execution.
 */
export class ExecuteCommandTool extends BaseTool {
  readonly name = "execute_command";
  readonly description =
    "Execute a shell command in the VS Code terminal. The command will run in a real VS Code terminal visible to the user. Use this to run build commands, tests, linters, or other CLI tools.";
  readonly requiresPermission = true;

  private static agentTerminal: vscode.Terminal | undefined;
  private static terminalCloseListener: vscode.Disposable | undefined;

  readonly parameters: ParameterDefinition[] = [
    {
      name: "command",
      type: "string",
      required: true,
      description: "The shell command to execute",
    },
    {
      name: "cwd",
      type: "string",
      required: false,
      description:
        "The working directory for the command (relative to workspace root). Defaults to workspace root.",
    },
  ];

  /**
   * Validate and normalize working directory path
   */
  private validateCwd(cwd: string | undefined): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error("No workspace folder is open");
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;

    if (!cwd) {
      return workspaceRoot;
    }

    const resolvedPath = path.isAbsolute(cwd)
      ? cwd
      : path.join(workspaceRoot, cwd);

    const normalizedPath = path.normalize(resolvedPath);

    if (!normalizedPath.startsWith(workspaceRoot)) {
      throw new Error(
        `Access denied: Working directory '${cwd}' is outside the workspace`
      );
    }

    return normalizedPath;
  }

  /**
   * Get or create a dedicated terminal for the agent
   */
  private getOrCreateTerminal(cwd: string): vscode.Terminal {
    // Check if terminal still exists and is not closed
    if (ExecuteCommandTool.agentTerminal) {
      const terminals = vscode.window.terminals;
      const terminalExists = terminals.includes(
        ExecuteCommandTool.agentTerminal
      );
      if (!terminalExists) {
        ExecuteCommandTool.agentTerminal = undefined;
      }
    }

    if (!ExecuteCommandTool.agentTerminal) {
      ExecuteCommandTool.agentTerminal = vscode.window.createTerminal({
        name: "Agent",
        cwd,
      });

      // Listen for terminal close
      if (!ExecuteCommandTool.terminalCloseListener) {
        ExecuteCommandTool.terminalCloseListener =
          vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === ExecuteCommandTool.agentTerminal) {
              ExecuteCommandTool.agentTerminal = undefined;
            }
          });
      }
    }

    return ExecuteCommandTool.agentTerminal;
  }

  /**
   * Wait for shell integration to become available
   */
  private async waitForShellIntegration(
    terminal: vscode.Terminal,
    timeout: number = 10000
  ): Promise<vscode.TerminalShellIntegration | undefined> {
    // Check if already available
    if (terminal.shellIntegration) {
      return terminal.shellIntegration;
    }

    // Wait for shell integration to activate
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        disposable.dispose();
        resolve(undefined);
      }, timeout);

      const disposable = vscode.window.onDidChangeTerminalShellIntegration(
        (e) => {
          if (e.terminal === terminal) {
            clearTimeout(timer);
            disposable.dispose();
            resolve(e.shellIntegration);
          }
        }
      );

      // Also check again in case it became available
      if (terminal.shellIntegration) {
        clearTimeout(timer);
        disposable.dispose();
        resolve(terminal.shellIntegration);
      }
    });
  }

  /**
   * Execute command using shell integration and capture output
   */
  private async executeWithShellIntegration(
    shellIntegration: vscode.TerminalShellIntegration,
    command: string,
    timeout: number = 60000
  ): Promise<{ output: string; exitCode: number | undefined }> {
    // Execute the command
    const execution = shellIntegration.executeCommand(command);

    // Start reading output immediately (before waiting for end)
    let output = "";
    const readPromise = (async () => {
      try {
        const stream = execution.read();
        for await (const data of stream) {
          output += data;
        }
      } catch {
        // Stream may close or error, that's ok
      }
    })();

    // Wait for command to end with timeout
    const endPromise = new Promise<number | undefined>((resolve, reject) => {
      const timer = setTimeout(() => {
        disposable.dispose();
        reject(new Error(`Command timed out after ${timeout / 1000} seconds`));
      }, timeout);

      const disposable = vscode.window.onDidEndTerminalShellExecution((e) => {
        if (e.execution === execution) {
          clearTimeout(timer);
          disposable.dispose();
          resolve(e.exitCode);
        }
      });
    });

    // Wait for both reading and command end
    const exitCode = await endPromise;
    await readPromise;

    return {
      output: output.trim(),
      exitCode,
    };
  }

  /**
   * Execute the command in VS Code's native terminal
   */
  async execute(params: Record<string, any>): Promise<string> {
    const command = params.command as string;
    const cwd = params.cwd as string | undefined;

    try {
      const validatedCwd = this.validateCwd(cwd);
      const terminal = this.getOrCreateTerminal(validatedCwd);

      // Show the terminal to the user
      terminal.show(false);

      // If cwd is specified, cd to that directory first (using sendText for cd)
      if (cwd) {
        const escapedPath = validatedCwd.includes(" ")
          ? `"${validatedCwd}"`
          : validatedCwd;
        terminal.sendText(`cd ${escapedPath}`, true);
        // Small delay to let cd complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Try to use shell integration for output capture
      const shellIntegration = await this.waitForShellIntegration(terminal);

      if (shellIntegration) {
        // Use shell integration to execute and capture output
        const { output, exitCode } = await this.executeWithShellIntegration(
          shellIntegration,
          command
        );

        let result = `Working directory: ${validatedCwd}\n`;
        result += `Exit code: ${exitCode ?? "unknown"}\n\n`;

        if (output) {
          result += `Output:\n${output}`;
        } else {
          result += "No output captured.";
        }

        if (exitCode !== undefined && exitCode !== 0) {
          throw new Error(result);
        }

        return result;
      } else {
        // Fallback: just send the command without output capture
        terminal.sendText(command, true);

        return `Command sent to VS Code terminal:\n\`\`\`\n${command}\n\`\`\`\nWorking directory: ${validatedCwd}\n\nNote: Shell integration not available. Check the terminal panel for output.`;
      }
    } catch (error: any) {
      if (error.message.includes("Working directory:")) {
        throw error;
      }
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }

  /**
   * Cleanup resources
   */
  static dispose(): void {
    if (ExecuteCommandTool.terminalCloseListener) {
      ExecuteCommandTool.terminalCloseListener.dispose();
      ExecuteCommandTool.terminalCloseListener = undefined;
    }
  }
}
