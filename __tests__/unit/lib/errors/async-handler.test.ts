/**
 * Unit Tests for asyncHandler
 */

import { asyncHandler } from '@/lib/errors/async-handler';

describe('asyncHandler', () => {
  describe('Success Cases', () => {
    test('should return result from successful async function', async () => {
      const handler = asyncHandler(async () => {
        return 'success';
      });

      const result = await handler();
      expect(result).toBe('success');
    });

    test('should pass arguments to wrapped function', async () => {
      const handler = asyncHandler(async (a: number, b: number) => {
        return a + b;
      });

      const result = await handler(5, 3);
      expect(result).toBe(8);
    });

    test('should handle multiple arguments', async () => {
      const handler = asyncHandler(async (name: string, age: number, active: boolean) => {
        return { name, age, active };
      });

      const result = await handler('John', 30, true);
      expect(result).toEqual({ name: 'John', age: 30, active: true });
    });

    test('should handle async function with Promise return', async () => {
      const handler = asyncHandler(async () => {
        return Promise.resolve('resolved');
      });

      const result = await handler();
      expect(result).toBe('resolved');
    });

    test('should handle complex return types', async () => {
      interface User {
        id: string;
        name: string;
        email: string;
      }

      const handler = asyncHandler(async (id: string): Promise<User> => {
        return {
          id,
          name: 'John Doe',
          email: 'john@example.com',
        };
      });

      const result = await handler('123');
      expect(result).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    test('should handle array return types', async () => {
      const handler = asyncHandler(async () => {
        return [1, 2, 3, 4, 5];
      });

      const result = await handler();
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should handle null return', async () => {
      const handler = asyncHandler(async () => {
        return null;
      });

      const result = await handler();
      expect(result).toBeNull();
    });

    test('should handle undefined return', async () => {
      const handler = asyncHandler(async () => {
        return undefined;
      });

      const result = await handler();
      expect(result).toBeUndefined();
    });
  });

  describe('Error Cases', () => {
    test('should propagate errors from async function', async () => {
      const handler = asyncHandler(async () => {
        throw new Error('Test error');
      });

      await expect(handler()).rejects.toThrow('Test error');
    });

    test('should preserve error type', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const handler = asyncHandler(async () => {
        throw new CustomError('Custom error');
      });

      await expect(handler()).rejects.toThrow(CustomError);
      await expect(handler()).rejects.toThrow('Custom error');
    });

    test('should handle rejected promises', async () => {
      const handler = asyncHandler(async () => {
        return Promise.reject(new Error('Rejected'));
      });

      await expect(handler()).rejects.toThrow('Rejected');
    });

    test('should handle errors with arguments', async () => {
      const handler = asyncHandler(async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Failed');
        }
        return 'success';
      });

      await expect(handler(true)).rejects.toThrow('Failed');
      await expect(handler(false)).resolves.toBe('success');
    });
  });

  describe('Type Preservation', () => {
    test('should preserve function signature for no-arg function', async () => {
      const original = async (): Promise<string> => 'test';
      const wrapped = asyncHandler(original);

      // TypeScript should allow calling without arguments
      const result = await wrapped();
      expect(result).toBe('test');
    });

    test('should preserve function signature for single-arg function', async () => {
      const original = async (x: number): Promise<number> => x * 2;
      const wrapped = asyncHandler(original);

      const result = await wrapped(5);
      expect(result).toBe(10);
    });

    test('should preserve function signature for multi-arg function', async () => {
      const original = async (a: string, b: number): Promise<string> => {
        return `${a}-${b}`;
      };
      const wrapped = asyncHandler(original);

      const result = await wrapped('test', 42);
      expect(result).toBe('test-42');
    });
  });

  describe('Edge Cases', () => {
    test('should handle function that returns Promise<void>', async () => {
      const handler = asyncHandler(async (): Promise<void> => {
        // Do nothing
      });

      const result = await handler();
      expect(result).toBeUndefined();
    });

    test('should handle async function with side effects', async () => {
      let sideEffect = 0;

      const handler = asyncHandler(async () => {
        sideEffect += 1;
        return sideEffect;
      });

      await handler();
      expect(sideEffect).toBe(1);

      await handler();
      expect(sideEffect).toBe(2);
    });

    test('should handle nested async operations', async () => {
      const handler = asyncHandler(async () => {
        const step1 = await Promise.resolve(1);
        const step2 = await Promise.resolve(step1 + 1);
        const step3 = await Promise.resolve(step2 + 1);
        return step3;
      });

      const result = await handler();
      expect(result).toBe(3);
    });

    test('should handle timeout operations', async () => {
      const handler = asyncHandler(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      const result = await handler();
      expect(result).toBe('done');
    });

    test('should be reusable', async () => {
      const handler = asyncHandler(async (x: number) => x * 2);

      const result1 = await handler(5);
      const result2 = await handler(10);
      const result3 = await handler(15);

      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(result3).toBe(30);
    });
  });

  describe('Real-World Use Cases', () => {
    test('should work with simulated API handler', async () => {
      interface Request {
        body: { name: string };
      }
      interface Response {
        status: number;
        data: { message: string };
      }

      const apiHandler = asyncHandler(async (req: Request): Promise<Response> => {
        return {
          status: 200,
          data: { message: `Hello, ${req.body.name}` },
        };
      });

      const result = await apiHandler({ body: { name: 'Alice' } });
      expect(result.status).toBe(200);
      expect(result.data.message).toBe('Hello, Alice');
    });

    test('should work with database simulation', async () => {
      const db = {
        findUser: async (id: string) => ({ id, name: 'User ' + id }),
      };

      const getUserHandler = asyncHandler(async (id: string) => {
        return await db.findUser(id);
      });

      const user = await getUserHandler('123');
      expect(user).toEqual({ id: '123', name: 'User 123' });
    });

    test('should work with validation logic', async () => {
      const validateAndProcess = asyncHandler(async (data: { email: string }) => {
        if (!data.email.includes('@')) {
          throw new Error('Invalid email');
        }
        return { valid: true, email: data.email };
      });

      await expect(validateAndProcess({ email: 'valid@example.com' })).resolves.toEqual({
        valid: true,
        email: 'valid@example.com',
      });

      await expect(validateAndProcess({ email: 'invalid' })).rejects.toThrow('Invalid email');
    });
  });
});
