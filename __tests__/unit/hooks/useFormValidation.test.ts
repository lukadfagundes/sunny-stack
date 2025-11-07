/**
 * Unit Tests for useFormValidation Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useFormValidation, ValidationSchema } from '@/hooks/useFormValidation';

interface TestFormData {
  name: string;
  email: string;
  age: number;
  password: string;
}

describe('useFormValidation', () => {
  const schema: ValidationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    age: {
      custom: (value) => {
        if (typeof value !== 'number') return 'Age must be a number';
        if (value < 18) return 'Must be 18 or older';
        return true;
      },
    },
    password: {
      required: true,
      minLength: 8,
    },
  };

  describe('Initialization', () => {
    test('should start with empty errors', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Required Validation', () => {
    test('should fail when required field is missing', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({ name: '', email: 'test@example.com' });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('name is required');
    });

    test('should pass when required field is provided', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          age: 25,
        });
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });

  describe('Length Validation', () => {
    test('should fail when value is too short', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'J',
          email: 'john@example.com',
          password: 'password123',
        });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('name must be at least 2 characters');
    });

    test('should fail when value is too long', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'a'.repeat(51),
          email: 'john@example.com',
          password: 'password123',
        });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('name must be no more than 50 characters');
    });

    test('should fail when password is too short', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'short',
        });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.password).toBe('password must be at least 8 characters');
    });
  });

  describe('Pattern Validation', () => {
    test('should fail when email pattern is invalid', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'John Doe',
          email: 'not-an-email',
          password: 'password123',
        });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('email is invalid');
    });

    test('should pass with valid email pattern', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          age: 25,
        });
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('Custom Validation', () => {
    test('should fail with custom error message', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          age: 16,
        });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.age).toBe('Must be 18 or older');
    });

    test('should pass custom validation', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          age: 25,
        });
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.age).toBeUndefined();
    });
  });

  describe('Partial Validation', () => {
    test('should validate only specified fields', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate(
          { name: '', email: 'invalid' },
          ['name'] // Only validate name
        );
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('name is required');
      expect(result.current.errors.email).toBeUndefined(); // Not validated
    });
  });

  describe('validateSingle', () => {
    test('should validate single field and update errors', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validateSingle('email', 'not-an-email');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('email is invalid');
    });

    test('should return true for valid field', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validateSingle('email', 'john@example.com');
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('clearErrors', () => {
    test('should clear specific field error', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      act(() => {
        result.current.validate({ name: '', email: '' });
      });

      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeDefined();

      act(() => {
        result.current.clearErrors(['name']);
      });

      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.email).toBeDefined(); // Still there
    });
  });

  describe('clearErrors (all)', () => {
    test('should clear all errors when called without arguments', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      act(() => {
        result.current.validate({ name: '', email: '' });
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Multiple Errors', () => {
    test('should collect all field errors', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(schema));

      let isValid;
      act(() => {
        isValid = result.current.validate({
          name: '',
          email: 'invalid',
          password: 'short',
        });
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBeTruthy();
      expect(result.current.errors.email).toBeTruthy();
      expect(result.current.errors.password).toBeTruthy();
    });
  });
});
