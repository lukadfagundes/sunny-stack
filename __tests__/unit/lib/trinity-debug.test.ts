/**
 * Unit Tests for TrinityDebugger
 */

import { TrinityDebugger, createDebugger, debuggers } from '@/lib/trinity-debug';

describe('TrinityDebugger', () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
  };
  let originalEnv: string | undefined;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('Constructor', () => {
    test('should create instance with module name', () => {
      const debug = new TrinityDebugger('TestModule');
      expect(debug).toBeInstanceOf(TrinityDebugger);
    });

    test('should enable debugging in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.info('test', 'message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    test('should disable debugging in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.info('test', 'message');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('entry', () => {
    test('should log entry in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.entry('testFunction', { param: 'value' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[ENTRY] testFunction',
        expect.objectContaining({
          params: { param: 'value' },
          module: 'TestModule',
          stack: 'Next.js 15/React 19/TypeScript',
        })
      );
    });

    test('should not log entry in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.entry('testFunction');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    test('should include timestamp', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.entry('testFunction');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('success', () => {
    test('should log success in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.success('testFunction', { data: 'result' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[SUCCESS] testFunction',
        expect.objectContaining({
          result: { data: 'result' },
          module: 'TestModule',
        })
      );
    });

    test('should not log success in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.success('testFunction');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    test('should always log errors even in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');
      const error = new Error('Test error');

      debug.error('testFunction', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR] testFunction',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
          module: 'TestModule',
        })
      );
    });

    test('should log errors in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');
      const error = new Error('Dev error');

      debug.error('testFunction', error);

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    test('should include error stack trace', () => {
      const debug = new TrinityDebugger('TestModule');
      const error = new Error('Test error');

      debug.error('testFunction', error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          stack: expect.any(String),
        })
      );
    });
  });

  describe('warning', () => {
    test('should log warning in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.warning('testFunction', 'Warning message', { data: 'info' });

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARNING] testFunction',
        expect.objectContaining({
          message: 'Warning message',
          data: { data: 'info' },
          module: 'TestModule',
        })
      );
    });

    test('should not log warning in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.warning('testFunction', 'Warning');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    test('should log info in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.info('testFunction', 'Info message', { key: 'value' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[INFO] testFunction',
        expect.objectContaining({
          message: 'Info message',
          data: { key: 'value' },
        })
      );
    });

    test('should not log info in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.info('testFunction', 'Info');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    test('should log slow operations over 100ms', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');
      const startTime = Date.now() - 150;

      debug.performance('testFunction', startTime);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[PERFORMANCE] testFunction',
        expect.objectContaining({
          duration: expect.stringContaining('ms'),
          slow: 'WARNING',
        })
      );
    });

    test('should mark critical for operations over 500ms', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');
      const startTime = Date.now() - 600;

      debug.performance('testFunction', startTime);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          slow: 'CRITICAL',
        })
      );
    });

    test('should not log fast operations under 100ms', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');
      const startTime = Date.now() - 50;

      debug.performance('testFunction', startTime);

      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    test('should not log in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');
      const startTime = Date.now() - 200;

      debug.performance('testFunction', startTime);
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('stateChange', () => {
    test('should log state changes in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.stateChange('testFunction', { old: 'value' }, { new: 'value' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[STATE] testFunction',
        expect.objectContaining({
          oldState: { old: 'value' },
          newState: { new: 'value' },
        })
      );
    });

    test('should not log state changes in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.stateChange('testFunction', {}, {});
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('apiCall', () => {
    test('should log API calls in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.apiCall('/api/test', 'POST', { data: 'payload' });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[API] POST /api/test',
        expect.objectContaining({
          data: { data: 'payload' },
        })
      );
    });

    test('should not log API calls in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.apiCall('/api/test', 'GET');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('apiResponse', () => {
    test('should log API responses in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.apiResponse('/api/test', 200, { success: true });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[API RESPONSE] /api/test',
        expect.objectContaining({
          status: 200,
          response: { success: true },
        })
      );
    });

    test('should not log API responses in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.apiResponse('/api/test', 200);
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    test('should log validation results in development', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.validation('email', 'test@example.com', true);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[VALIDATION] email',
        expect.objectContaining({
          value: 'test@example.com',
          isValid: true,
        })
      );
    });

    test('should log validation errors', () => {
      process.env.NODE_ENV = 'development';
      const debug = new TrinityDebugger('TestModule');

      debug.validation('email', 'invalid', false, 'Invalid format');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isValid: false,
          error: 'Invalid format',
        })
      );
    });

    test('should not log validation in production', () => {
      process.env.NODE_ENV = 'production';
      const debug = new TrinityDebugger('TestModule');

      debug.validation('field', 'value', true);
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('createDebugger', () => {
    test('should create new debugger instance', () => {
      const debug = createDebugger('NewModule');
      expect(debug).toBeInstanceOf(TrinityDebugger);
    });

    test('should create debugger with correct module name', () => {
      process.env.NODE_ENV = 'development';
      const debug = createDebugger('CustomModule');

      debug.info('test', 'message');

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          module: 'CustomModule',
        })
      );
    });
  });

  describe('Pre-configured debuggers', () => {
    test('should have api debugger', () => {
      expect(debuggers.api).toBeInstanceOf(TrinityDebugger);
    });

    test('should have validation debugger', () => {
      expect(debuggers.validation).toBeInstanceOf(TrinityDebugger);
    });

    test('should have forms debugger', () => {
      expect(debuggers.forms).toBeInstanceOf(TrinityDebugger);
    });

    test('should have navigation debugger', () => {
      expect(debuggers.navigation).toBeInstanceOf(TrinityDebugger);
    });

    test('should have auth debugger', () => {
      expect(debuggers.auth).toBeInstanceOf(TrinityDebugger);
    });

    test('should have performance debugger', () => {
      expect(debuggers.performance).toBeInstanceOf(TrinityDebugger);
    });
  });
});
