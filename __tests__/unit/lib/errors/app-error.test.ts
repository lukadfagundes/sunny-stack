/**
 * Unit Tests for AppError and Custom Error Classes
 */

import {
  AppError,
  ValidationError,
  AuthError,
  DatabaseError,
  NotFoundError,
} from '@/lib/errors/app-error';

describe('AppError', () => {
  describe('Constructor', () => {
    test('should create error with message', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
    });

    test('should have default statusCode of 500', () => {
      const error = new AppError('Test error');
      expect(error.statusCode).toBe(500);
    });

    test('should accept custom statusCode', () => {
      const error = new AppError('Test error', 400);
      expect(error.statusCode).toBe(400);
    });

    test('should be operational by default', () => {
      const error = new AppError('Test error');
      expect(error.isOperational).toBe(true);
    });

    test('should accept isOperational parameter', () => {
      const error = new AppError('Test error', 500, false);
      expect(error.isOperational).toBe(false);
    });

    test('should set name to AppError', () => {
      const error = new AppError('Test error');
      expect(error.name).toBe('AppError');
    });

    test('should be instance of Error', () => {
      const error = new AppError('Test error');
      expect(error).toBeInstanceOf(Error);
    });

    test('should be instance of AppError', () => {
      const error = new AppError('Test error');
      expect(error).toBeInstanceOf(AppError);
    });

    test('should have stack trace', () => {
      const error = new AppError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });
});

describe('ValidationError', () => {
  describe('Constructor', () => {
    test('should create error with message', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
    });

    test('should have statusCode 400', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    test('should set name to ValidationError', () => {
      const error = new ValidationError('Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    test('should accept optional field parameter', () => {
      const error = new ValidationError('Invalid email', 'email');
      expect(error.field).toBe('email');
    });

    test('should have undefined field when not provided', () => {
      const error = new ValidationError('Invalid input');
      expect(error.field).toBeUndefined();
    });

    test('should be operational', () => {
      const error = new ValidationError('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    test('should be instance of AppError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(AppError);
    });

    test('should be instance of ValidationError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(ValidationError);
    });
  });
});

describe('AuthError', () => {
  describe('Constructor', () => {
    test('should create error with message', () => {
      const error = new AuthError('Unauthorized');
      expect(error.message).toBe('Unauthorized');
    });

    test('should have default statusCode 401', () => {
      const error = new AuthError('Unauthorized');
      expect(error.statusCode).toBe(401);
    });

    test('should accept custom statusCode', () => {
      const error = new AuthError('Forbidden', 403);
      expect(error.statusCode).toBe(403);
    });

    test('should set name to AuthError', () => {
      const error = new AuthError('Unauthorized');
      expect(error.name).toBe('AuthError');
    });

    test('should be operational', () => {
      const error = new AuthError('Unauthorized');
      expect(error.isOperational).toBe(true);
    });

    test('should be instance of AppError', () => {
      const error = new AuthError('Unauthorized');
      expect(error).toBeInstanceOf(AppError);
    });

    test('should be instance of AuthError', () => {
      const error = new AuthError('Unauthorized');
      expect(error).toBeInstanceOf(AuthError);
    });

    test('should handle 401 Unauthorized', () => {
      const error = new AuthError('Token expired', 401);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token expired');
    });

    test('should handle 403 Forbidden', () => {
      const error = new AuthError('Insufficient permissions', 403);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
    });
  });
});

describe('DatabaseError', () => {
  describe('Constructor', () => {
    test('should create error with message', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.message).toBe('Connection failed');
    });

    test('should have statusCode 500', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.statusCode).toBe(500);
    });

    test('should set name to DatabaseError', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.name).toBe('DatabaseError');
    });

    test('should accept optional originalError parameter', () => {
      const originalError = new Error('DB timeout');
      const error = new DatabaseError('Connection failed', originalError);
      expect(error.originalError).toBe(originalError);
    });

    test('should have undefined originalError when not provided', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.originalError).toBeUndefined();
    });

    test('should be operational', () => {
      const error = new DatabaseError('Connection failed');
      expect(error.isOperational).toBe(true);
    });

    test('should be instance of AppError', () => {
      const error = new DatabaseError('Connection failed');
      expect(error).toBeInstanceOf(AppError);
    });

    test('should be instance of DatabaseError', () => {
      const error = new DatabaseError('Connection failed');
      expect(error).toBeInstanceOf(DatabaseError);
    });

    test('should preserve original error stack', () => {
      const originalError = new Error('DB timeout');
      const error = new DatabaseError('Connection failed', originalError);
      expect(error.originalError?.stack).toBeDefined();
    });
  });
});

describe('NotFoundError', () => {
  describe('Constructor', () => {
    test('should create error with resource and id', () => {
      const error = new NotFoundError('User', '123');
      expect(error.message).toBe('User not found: 123');
    });

    test('should have statusCode 404', () => {
      const error = new NotFoundError('User', '123');
      expect(error.statusCode).toBe(404);
    });

    test('should set name to NotFoundError', () => {
      const error = new NotFoundError('User', '123');
      expect(error.name).toBe('NotFoundError');
    });

    test('should store resource property', () => {
      const error = new NotFoundError('User', '123');
      expect(error.resource).toBe('User');
    });

    test('should store id property', () => {
      const error = new NotFoundError('User', '123');
      expect(error.id).toBe('123');
    });

    test('should be operational', () => {
      const error = new NotFoundError('User', '123');
      expect(error.isOperational).toBe(true);
    });

    test('should be instance of AppError', () => {
      const error = new NotFoundError('User', '123');
      expect(error).toBeInstanceOf(AppError);
    });

    test('should be instance of NotFoundError', () => {
      const error = new NotFoundError('User', '123');
      expect(error).toBeInstanceOf(NotFoundError);
    });

    test('should format message correctly', () => {
      const error = new NotFoundError('Project', 'abc-123');
      expect(error.message).toBe('Project not found: abc-123');
    });

    test('should handle numeric IDs', () => {
      const error = new NotFoundError('Quote', '456');
      expect(error.message).toBe('Quote not found: 456');
      expect(error.id).toBe('456');
    });
  });
});

describe('Error Inheritance', () => {
  test('ValidationError should be caught as AppError', () => {
    try {
      throw new ValidationError('Invalid');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
    }
  });

  test('AuthError should be caught as AppError', () => {
    try {
      throw new AuthError('Unauthorized');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
    }
  });

  test('DatabaseError should be caught as AppError', () => {
    try {
      throw new DatabaseError('Connection failed');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
    }
  });

  test('NotFoundError should be caught as AppError', () => {
    try {
      throw new NotFoundError('Resource', 'id');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
    }
  });

  test('all custom errors should be caught as Error', () => {
    const errors = [
      new AppError('App error'),
      new ValidationError('Validation error'),
      new AuthError('Auth error'),
      new DatabaseError('Database error'),
      new NotFoundError('Resource', 'id'),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(Error);
    });
  });
});

describe('Error Properties', () => {
  test('should maintain error properties when thrown and caught', () => {
    try {
      throw new ValidationError('Invalid email', 'email');
    } catch (error) {
      if (error instanceof ValidationError) {
        expect(error.message).toBe('Invalid email');
        expect(error.field).toBe('email');
        expect(error.statusCode).toBe(400);
        expect(error.isOperational).toBe(true);
      }
    }
  });

  test('should maintain complex error properties', () => {
    const originalError = new Error('Original');
    try {
      throw new DatabaseError('Wrapped error', originalError);
    } catch (error) {
      if (error instanceof DatabaseError) {
        expect(error.originalError).toBe(originalError);
        expect(error.originalError?.message).toBe('Original');
      }
    }
  });
});
