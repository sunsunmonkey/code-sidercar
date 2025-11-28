import * as assert from 'assert';
import { ErrorHandler, ErrorType, ErrorContext } from '../ErrorHandler';

suite('ErrorHandler Test Suite', () => {
  let errorHandler: ErrorHandler;

  setup(() => {
    errorHandler = new ErrorHandler();
  });

  teardown(() => {
    errorHandler.clearErrorLog();
  });

  test('Should classify API errors correctly', () => {
    const apiError = new Error('API authentication failed');
    const context: ErrorContext = {
      operation: 'api_call',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(apiError, context);

    assert.strictEqual(response.shouldRetry, false);
    assert.ok(response.userMessage.includes('authentication'));
    assert.ok(response.userMessage.includes('API key'));
  });

  test('Should classify network errors correctly', () => {
    const networkError = new Error('Network timeout occurred');
    const context: ErrorContext = {
      operation: 'network_request',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(networkError, context);

    assert.strictEqual(response.shouldRetry, true);
    assert.ok(response.userMessage.includes('Network') || response.userMessage.includes('network'));
  });

  test('Should classify tool errors correctly', () => {
    const toolError = new Error('File not found: /path/to/file.txt');
    const context: ErrorContext = {
      operation: 'read_file',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(toolError, context);

    assert.strictEqual(response.shouldRetry, false);
    assert.ok(response.userMessage.includes('File not found') || response.userMessage.includes('file'));
  });

  test('Should classify permission errors correctly', () => {
    const permissionError = new Error('Permission denied for operation');
    const context: ErrorContext = {
      operation: 'write_file',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(permissionError, context);

    assert.strictEqual(response.shouldRetry, false);
    assert.ok(response.userMessage.includes('Permission') || response.userMessage.includes('permission'));
  });

  test('Should log errors correctly', () => {
    const error = new Error('Test error');
    const context: ErrorContext = {
      operation: 'test_operation',
      timestamp: new Date(),
    };

    errorHandler.handleError(error, context);

    const log = errorHandler.getErrorLog();
    assert.strictEqual(log.length, 1);
    assert.strictEqual(log[0].message, 'Test error');
    assert.strictEqual(log[0].context.operation, 'test_operation');
  });

  test('Should track retry attempts for network errors', () => {
    const networkError = new Error('Network connection failed');
    const context: ErrorContext = {
      operation: 'api_request',
      timestamp: new Date(),
    };

    // First attempt
    let response = errorHandler.handleError(networkError, context);
    assert.strictEqual(response.shouldRetry, true);
    assert.strictEqual(errorHandler.getRetryAttempts('api_request'), 1);

    // Second attempt
    response = errorHandler.handleError(networkError, context);
    assert.strictEqual(response.shouldRetry, true);
    assert.strictEqual(errorHandler.getRetryAttempts('api_request'), 2);

    // Third attempt
    response = errorHandler.handleError(networkError, context);
    assert.strictEqual(response.shouldRetry, true);
    assert.strictEqual(errorHandler.getRetryAttempts('api_request'), 3);

    // Fourth attempt - should not retry
    response = errorHandler.handleError(networkError, context);
    assert.strictEqual(response.shouldRetry, false);
    assert.ok(response.userMessage.includes('multiple attempts'));
  });

  test('Should reset retry attempts', () => {
    const networkError = new Error('Network error');
    const context: ErrorContext = {
      operation: 'test_op',
      timestamp: new Date(),
    };

    errorHandler.handleError(networkError, context);
    assert.strictEqual(errorHandler.getRetryAttempts('test_op'), 1);

    errorHandler.resetRetryAttempts('test_op');
    assert.strictEqual(errorHandler.getRetryAttempts('test_op'), 0);
  });

  test('Should identify retryable errors', () => {
    const networkError = new Error('Network timeout');
    const parsingError = new Error('XML parsing failed');
    const toolError = new Error('File not found');

    assert.strictEqual(errorHandler.isRetryable(networkError), true);
    assert.strictEqual(errorHandler.isRetryable(parsingError), true);
    assert.strictEqual(errorHandler.isRetryable(toolError), false);
  });

  test('Should mark errors as resolved', () => {
    const error = new Error('Test error');
    const context: ErrorContext = {
      operation: 'test',
      timestamp: new Date(),
    };

    errorHandler.handleError(error, context);
    const log = errorHandler.getErrorLog();
    const errorId = log[0].id;

    assert.strictEqual(log[0].resolved, false);

    errorHandler.markErrorResolved(errorId);
    const updatedLog = errorHandler.getErrorLog();
    assert.strictEqual(updatedLog[0].resolved, true);
  });

  test('Should get unresolved errors', () => {
    const error1 = new Error('Error 1');
    const error2 = new Error('Error 2');
    const context: ErrorContext = {
      operation: 'test',
      timestamp: new Date(),
    };

    errorHandler.handleError(error1, context);
    errorHandler.handleError(error2, context);

    const log = errorHandler.getErrorLog();
    errorHandler.markErrorResolved(log[0].id);

    const unresolved = errorHandler.getUnresolvedErrors();
    assert.strictEqual(unresolved.length, 1);
    assert.strictEqual(unresolved[0].message, 'Error 2');
  });

  test('Should maintain log size limit', () => {
    const context: ErrorContext = {
      operation: 'test',
      timestamp: new Date(),
    };

    // Add more than MAX_LOG_SIZE errors
    for (let i = 0; i < 150; i++) {
      errorHandler.handleError(new Error(`Error ${i}`), context);
    }

    const log = errorHandler.getErrorLog();
    assert.ok(log.length <= 100);
  });

  test('Should provide error statistics', () => {
    const apiError = new Error('API error');
    const networkError = new Error('Network timeout');
    const toolError = new Error('File not found');
    const context: ErrorContext = {
      operation: 'test',
      timestamp: new Date(),
    };

    errorHandler.handleError(apiError, context);
    errorHandler.handleError(networkError, context);
    errorHandler.handleError(toolError, context);

    const stats = errorHandler.getErrorStatistics();
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.unresolved, 3);
    assert.strictEqual(stats.resolved, 0);
  });

  test('Should clear error log', () => {
    const error = new Error('Test error');
    const context: ErrorContext = {
      operation: 'test',
      timestamp: new Date(),
    };

    errorHandler.handleError(error, context);
    assert.strictEqual(errorHandler.getErrorLog().length, 1);

    errorHandler.clearErrorLog();
    assert.strictEqual(errorHandler.getErrorLog().length, 0);
  });

  test('Should handle rate limit errors', () => {
    const rateLimitError = new Error('Rate limit exceeded');
    const context: ErrorContext = {
      operation: 'api_call',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(rateLimitError, context);

    assert.strictEqual(response.shouldRetry, true);
    assert.ok(response.userMessage.includes('rate limit'));
  });

  test('Should handle parsing errors', () => {
    const parsingError = new Error('XML parsing failed');
    const context: ErrorContext = {
      operation: 'parse_response',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(parsingError, context);

    assert.strictEqual(response.shouldRetry, true);
    assert.ok(response.userMessage.includes('parse'));
  });

  test('Should sanitize long error messages', () => {
    const longMessage = 'A'.repeat(300);
    const error = new Error(longMessage);
    const context: ErrorContext = {
      operation: 'test',
      timestamp: new Date(),
    };

    const response = errorHandler.handleError(error, context);

    // User message should be truncated
    assert.ok(response.userMessage.length < longMessage.length);
  });

  test('Should attempt recovery for network errors', async () => {
    const networkError = new Error('Network timeout');
    const context: ErrorContext = {
      operation: 'api_request',
      timestamp: new Date(),
    };

    const canRecover = await errorHandler.attemptRecovery(networkError, context);
    assert.strictEqual(canRecover, true);
  });

  test('Should not attempt recovery for non-retryable errors', async () => {
    const toolError = new Error('File not found');
    const context: ErrorContext = {
      operation: 'read_file',
      timestamp: new Date(),
    };

    const canRecover = await errorHandler.attemptRecovery(toolError, context);
    assert.strictEqual(canRecover, false);
  });
});
