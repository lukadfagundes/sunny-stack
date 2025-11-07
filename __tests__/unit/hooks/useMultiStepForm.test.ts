/**
 * Unit Tests for useMultiStepForm Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';

describe('useMultiStepForm', () => {
  describe('Initialization', () => {
    test('should start at step 0', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      expect(result.current.currentStep).toBe(0);
      expect(result.current.totalSteps).toBe(5);
    });

    test('should correctly identify first step', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
    });
  });

  describe('Navigation', () => {
    test('should move to next step', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.isFirstStep).toBe(false);
    });

    test('should move to previous step', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.currentStep).toBe(1);
    });

    test('should jump to specific step', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.currentStep).toBe(3);
    });

    test('should not go beyond last step', () => {
      const { result } = renderHook(() => useMultiStepForm(3));

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep(); // Should not go beyond
      });

      expect(result.current.currentStep).toBe(2); // Last step (0-indexed)
      expect(result.current.isLastStep).toBe(true);
    });

    test('should not go below first step', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.previousStep();
        result.current.previousStep(); // Should not go below 0
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
    });

    test('should not jump to invalid step (negative)', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.nextStep();
        result.current.goToStep(-1);
      });

      expect(result.current.currentStep).toBe(1); // Should not change
    });

    test('should not jump to invalid step (beyond total)', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.nextStep();
        result.current.goToStep(10);
      });

      expect(result.current.currentStep).toBe(1); // Should not change
    });
  });

  describe('Reset', () => {
    test('should reset to first step', () => {
      const { result } = renderHook(() => useMultiStepForm(5));

      act(() => {
        result.current.nextStep();
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe(0);
      expect(result.current.isFirstStep).toBe(true);
    });
  });

  describe('Boundary Indicators', () => {
    test('should correctly identify first and last steps', () => {
      const { result } = renderHook(() => useMultiStepForm(3));

      // At first step
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);

      // At middle step
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(false);

      // At last step
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.isLastStep).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle single step form', () => {
      const { result } = renderHook(() => useMultiStepForm(1));

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(true);
      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(0); // Should stay at 0
    });

    test('should handle two step form', () => {
      const { result } = renderHook(() => useMultiStepForm(2));

      expect(result.current.currentStep).toBe(0);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.isLastStep).toBe(true);
    });
  });

  describe('Return Value Stability', () => {
    test('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useMultiStepForm(5));

      const { nextStep, previousStep, goToStep, reset } = result.current;

      rerender();

      expect(result.current.nextStep).toBe(nextStep);
      expect(result.current.previousStep).toBe(previousStep);
      expect(result.current.goToStep).toBe(goToStep);
      expect(result.current.reset).toBe(reset);
    });
  });
});
