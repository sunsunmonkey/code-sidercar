import * as vscode from "vscode";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { BaseTool, ParameterDefinition } from "./Tool";

/**
 * ExecuteCommandTool - executes shell commands in the extension host
 *
 * This tool runs shell commands directly and captures output without
 * opening a VS Code terminal. This tool requires user permission before execution.
 */
export class ExecuteCommandTool extends BaseTool {
  readonly name = "execute_command";
  readonly description =
    "Execute a shell command directly in the extension host and capture output. Use this to run build commands, tests, linters, or other CLI tools.";
  readonly requiresPermission = true;
  private static readonly execAsync = promisify(exec);

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
   * Execute command and capture output
   */
  private async executeCommand(
    command: string,
    cwd: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const { stdout, stderr } = await ExecuteCommandTool.execAsync(command, {
        cwd,
        windowsHide: true,
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } catch (error: any) {
      const stdout =
        typeof error.stdout === "string" ? error.stdout.trim() : "";
      const stderr =
        typeof error.stderr === "string"
          ? error.stderr.trim()
          : typeof error.message === "string"
            ? error.message
            : "Command failed.";
      const exitCode = typeof error.code === "number" ? error.code : 1;

      return {
        stdout,
        stderr,
        exitCode,
      };
    }
  }

  /**
   * Execute the command directly without opening a terminal
   */
  async execute(params: Record<string, any>): Promise<string> {
    const command = params.command as string;
    const cwd = params.cwd as string | undefined;

    try {
      const validatedCwd = this.validateCwd(cwd);
      const { stdout, stderr, exitCode } = await this.executeCommand(
        command,
        validatedCwd
      );

      let result = `Working directory: ${validatedCwd}\n`;
      result += `Exit code: ${exitCode}\n\n`;

      if (stdout) {
        result += `Stdout:\n${stdout}\n`;
      }

      if (stderr) {
        result += `${stdout ? "\n" : ""}Stderr:\n${stderr}\n`;
      }

      if (!stdout && !stderr) {
        result += "No output captured.";
      }

      if (exitCode !== 0) {
        throw new Error(result);
      }

      return result;
    } catch (error: any) {
      if (error.message.includes("Working directory:")) {
        throw error;
      }
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }
}
