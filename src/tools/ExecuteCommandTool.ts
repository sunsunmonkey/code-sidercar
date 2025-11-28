import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseTool, ParameterDefinition } from './Tool';

const execAsync = promisify(exec);

/**
 * ExecuteCommandTool - executes terminal commands with working directory support
 * Requirements: 13.5
 * 
 * This tool executes shell commands in the terminal and returns the output.
 * It supports specifying a working directory and includes security checks.
 * This tool requires user permission before execution.
 */
export class ExecuteCommandTool extends BaseTool {
  readonly name = 'execute_command';
  readonly description = 'Execute a shell command in the terminal and return the output. Supports specifying a working directory. Use this to run build commands, tests, linters, or other CLI tools.';
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
   * Execute the command
   * Requirements: 13.5
   */
  async execute(params: Record<string, any>): Promise<string> {
    const command = params.command as string;
    const cwd = params.cwd as string | undefined;
    
    try {
      // Validate and normalize the working directory
      const validatedCwd = this.validateCwd(cwd);
      
      // Execute the command with timeout (30 seconds)
      const { stdout, stderr } = await execAsync(command, {
        cwd: validatedCwd,
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      
      // Build result message
      let result = `Command executed successfully in: ${cwd || '.'}\n`;
      result += `Command: ${command}\n\n`;
      
      if (stdout) {
        result += `STDOUT:\n${stdout}\n`;
      }
      
      if (stderr) {
        result += `STDERR:\n${stderr}\n`;
      }
      
      if (!stdout && !stderr) {
        result += 'No output produced.\n';
      }
      
      return result;
      
    } catch (error: any) {
      // Handle execution errors
      if (error.killed) {
        throw new Error(`Command timed out after 30 seconds: ${command}`);
      }
      
      if (error.code !== undefined) {
        // Command executed but returned non-zero exit code
        let errorMsg = `Command failed with exit code ${error.code}: ${command}\n\n`;
        
        if (error.stdout) {
          errorMsg += `STDOUT:\n${error.stdout}\n`;
        }
        
        if (error.stderr) {
          errorMsg += `STDERR:\n${error.stderr}\n`;
        }
        
        throw new Error(errorMsg);
      }
      
      // Other errors (e.g., command not found, permission denied)
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }
}
