import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { BaseTool, ParameterDefinition } from './Tool';

/**
 * Custom Pseudoterminal implementation for capturing command output
 */
class CommandPseudoterminal implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>();
  private closeEmitter = new vscode.EventEmitter<number | void>();

  onDidWrite: vscode.Event<string> = this.writeEmitter.event;
  onDidClose: vscode.Event<number | void> = this.closeEmitter.event;

  private output: string[] = [];

  constructor(
    private command: string,
    private cwd: string,
    private onComplete: (output: string, exitCode: number) => void
  ) {}

  open(_initialDimensions: vscode.TerminalDimensions | undefined): void {
    this.executeCommand();
  }

  close(): void {
    // Cleanup
  }

  getOutput(): string {
    return this.output.join('');
  }

  private executeCommand(): void {
    // Write command being executed
    this.write(`\x1b[1m$ ${this.command}\x1b[0m\r\n`);

    // Determine shell based on platform
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
    const shellArgs = process.platform === 'win32' ? ['/c', this.command] : ['-c', this.command];

    // Spawn the process
    const proc = spawn(shell, shellArgs, {
      cwd: this.cwd,
      shell: false,
      env: process.env,
    });

    // Handle stdout
    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      this.output.push(text);
      this.write(text.replace(/\n/g, '\r\n'));
    });

    // Handle stderr
    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      this.output.push(text);
      // Write stderr in red
      this.write(`\x1b[31m${text.replace(/\n/g, '\r\n')}\x1b[0m`);
    });

    // Handle process completion
    proc.on('close', (code) => {
      const exitCode = code ?? 0;

      if (exitCode === 0) {
        this.write(`\r\n\x1b[32m✓ Command completed successfully (exit code: ${exitCode})\x1b[0m\r\n`);
      } else {
        this.write(`\r\n\x1b[31m✗ Command failed (exit code: ${exitCode})\x1b[0m\r\n`);
      }

      // Notify completion
      this.onComplete(this.getOutput(), exitCode);

      // Terminal remains open for user to review output
    });

    // Handle errors
    proc.on('error', (error) => {
      const errorMsg = `Failed to execute command: ${error.message}`;
      this.output.push(errorMsg);
      this.write(`\r\n\x1b[31m${errorMsg}\x1b[0m\r\n`);
      this.onComplete(this.getOutput(), 1);
      // Terminal remains open for user to review error
    });
  }

  private write(data: string): void {
    this.writeEmitter.fire(data);
  }
}

/**
 * ExecuteCommandTool - executes terminal commands in VS Code terminal
 * Requirements: 13.5
 *
 * This tool executes shell commands in a visible VS Code terminal and returns the output.
 * It supports specifying a working directory and includes security checks.
 * This tool requires user permission before execution.
 */
export class ExecuteCommandTool extends BaseTool {
  readonly name = 'execute_command';
  readonly description = 'Execute a shell command in the VS Code terminal and return the output. The command will be visible in the terminal. Supports specifying a working directory. Use this to run build commands, tests, linters, or other CLI tools.';
  readonly requiresPermission = true; // Command execution requires permission

  readonly parameters: ParameterDefinition[] = [
    {
      name: 'command',
      type: 'string',
      required: true,
      description: 'The shell command to execute',
    },
    {
      name: 'cwd',
      type: 'string',
      required: false,
      description: 'The working directory for the command (relative to workspace root). Defaults to workspace root.',
    },
  ];

  /**
   * Validate and normalize working directory path
   * Requirements: 13.5
   */
  private validateCwd(cwd: string | undefined): string {
    // Get workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder is open');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // If no cwd specified, use workspace root
    if (!cwd) {
      return workspaceRoot;
    }
    
    // Resolve the path relative to workspace root
    const resolvedPath = path.isAbsolute(cwd) 
      ? cwd 
      : path.join(workspaceRoot, cwd);
    
    // Normalize the path to resolve .. and .
    const normalizedPath = path.normalize(resolvedPath);
    
    // Check if the normalized path is within the workspace
    if (!normalizedPath.startsWith(workspaceRoot)) {
      throw new Error(`Access denied: Working directory '${cwd}' is outside the workspace`);
    }
    
    return normalizedPath;
  }

  /**
   * Execute the command in a VS Code terminal
   * Requirements: 13.5
   */
  async execute(params: Record<string, any>): Promise<string> {
    const command = params.command as string;
    const cwd = params.cwd as string | undefined;

    try {
      // Validate and normalize the working directory
      const validatedCwd = this.validateCwd(cwd);

      // Create a promise to wait for command completion
      const executionPromise = new Promise<{ output: string; exitCode: number }>((resolve) => {
        // Create pseudoterminal
        const pty = new CommandPseudoterminal(command, validatedCwd, (output, exitCode) => {
          resolve({ output, exitCode });
        });

        // Create terminal with the pseudoterminal
        const terminal = vscode.window.createTerminal({
          name: `Agent: ${command.substring(0, 30)}${command.length > 30 ? '...' : ''}`,
          pty,
        });

        // Show the terminal
        terminal.show(false); // false = don't take focus
      });

      // Wait for command to complete with timeout (60 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Command timed out after 60 seconds: ${command}`));
        }, 60000);
      });

      const { output, exitCode } = await Promise.race([executionPromise, timeoutPromise]);

      // Build result message
      let result = `Command executed in VS Code terminal\n`;
      result += `Working directory: ${cwd || '.'}\n`;
      result += `Command: ${command}\n`;
      result += `Exit code: ${exitCode}\n\n`;

      if (output.trim()) {
        result += `Output:\n${output}`;
      } else {
        result += 'No output produced.\n';
      }

      // If command failed, throw an error with the output
      if (exitCode !== 0) {
        throw new Error(result);
      }

      return result;

    } catch (error: any) {
      // Re-throw with context if not already formatted
      if (error.message.includes('Command executed in VS Code terminal')) {
        throw error;
      }
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }
}
