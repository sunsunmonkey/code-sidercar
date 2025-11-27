import { BaseTool, ParameterDefinition } from './Tool';

/**
 * Echo tool - simple example tool for testing
 * Echoes back the input message
 */
export class EchoTool extends BaseTool {
  readonly name = 'echo';
  readonly description = 'Echo back a message. Useful for testing tool execution.';
  readonly requiresPermission = false;
  
  readonly parameters: ParameterDefinition[] = [
    {
      name: 'message',
      type: 'string',
      required: true,
      description: 'The message to echo back',
    },
  ];

  async execute(params: Record<string, any>): Promise<string> {
    const message = params.message as string;
    return `Echo: ${message}`;
  }
}
