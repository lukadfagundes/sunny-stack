/**
 * Unit Tests for useTechnicalForm Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTechnicalForm } from '@/hooks/useTechnicalForm';

// Mock fetch
global.fetch = jest.fn();

// Mock window.alert
global.alert = jest.fn();

describe('useTechnicalForm', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (global.alert as jest.Mock).mockReset();
  });

  describe('Initialization', () => {
    test('should initialize with empty form data', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      expect(result.current.formData.contactName).toBe('');
      expect(result.current.formData.contactEmail).toBe('');
      expect(result.current.formData.companyName).toBe('');
      expect(result.current.formData.projectName).toBe('');
      expect(result.current.formData.projectType).toBe('');
      expect(result.current.formData.projectDescription).toBe('');
      expect(result.current.formData.targetAudience).toBe('');
      expect(result.current.formData.primaryGoals).toBe('');
      expect(result.current.formData.techStack).toBe('');
      expect(result.current.formData.hostingPreference).toBe('');
      expect(result.current.formData.budget).toBe('');
      expect(result.current.formData.timeline).toBe('');
      expect(result.current.formData.features).toBe('');
      expect(result.current.formData.integrations).toBe('');
      expect(result.current.formData.designStatus).toBe('');
      expect(result.current.formData.additionalNotes).toBe('');
    });

    test('should initialize with empty errors', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      expect(result.current.errors).toEqual({});
    });

    test('should initialize isSubmitting as false', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('handleFieldChange', () => {
    test('should update single field', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
      });

      expect(result.current.formData.contactName).toBe('John Doe');
    });

    test('should update multiple fields independently', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      act(() => {
        result.current.handleFieldChange('contactName', 'Jane Smith');
      });

      act(() => {
        result.current.handleFieldChange('contactEmail', 'jane@example.com');
      });

      act(() => {
        result.current.handleFieldChange('companyName', 'Acme Corp');
      });

      expect(result.current.formData.contactName).toBe('Jane Smith');
      expect(result.current.formData.contactEmail).toBe('jane@example.com');
      expect(result.current.formData.companyName).toBe('Acme Corp');
    });

    test('should clear field error when field is updated', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Manually set an error
      act(() => {
        result.current.handleSubmit();
      });

      // Error should exist for contactName (required field)
      expect(result.current.errors.contactName).toBeDefined();

      // Update the field
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
      });

      // Error should be cleared
      expect(result.current.errors.contactName).toBe('');
    });

    test('should handle project-specific fields', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      act(() => {
        result.current.handleFieldChange('projectName', 'My Project');
      });
      act(() => {
        result.current.handleFieldChange('techStack', 'React, Node.js');
      });
      act(() => {
        result.current.handleFieldChange('additionalNotes', 'Please hurry');
      });

      expect(result.current.formData.projectName).toBe('My Project');
      expect(result.current.formData.techStack).toBe('React, Node.js');
      expect(result.current.formData.additionalNotes).toBe('Please hurry');
    });
  });

  describe('handleSubmit - Validation', () => {
    test('should show validation errors for empty required fields', async () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.contactName).toBeDefined();
      expect(result.current.errors.contactEmail).toBeDefined();
      expect(result.current.errors.projectDescription).toBeDefined();
      expect(result.current.isSubmitting).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Please correct the validation errors before submitting.');
    });

    test('should not call fetch when validation fails', async () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should validate email format', async () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
        result.current.handleFieldChange('contactEmail', 'invalid-email');
        result.current.handleFieldChange('projectDescription', 'A project');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.errors.contactEmail).toBeDefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('handleSubmit - Success', () => {
    test('should submit valid form data successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Fill all required fields for technical form
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
      });
      act(() => {
        result.current.handleFieldChange('contactEmail', 'john@example.com');
      });
      act(() => {
        result.current.handleFieldChange('projectName', 'My Project');
      });
      act(() => {
        result.current.handleFieldChange('projectType', 'Web Application');
      });
      act(() => {
        result.current.handleFieldChange('projectDescription', 'Build a comprehensive web application with modern features and functionality');
      });
      act(() => {
        result.current.handleFieldChange('features', 'User authentication, Dashboard, Analytics, API integration');
      });
      act(() => {
        result.current.handleFieldChange('timeline', '3-6 months');
      });
      act(() => {
        result.current.handleFieldChange('budget', '$10,000 - $25,000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('technical'),
      });

      expect(mockOnComplete).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Thank you! Your technical requirements have been sent.')
      );
    });

    test('should include formType: technical in request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Fill all required fields
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
      });
      act(() => {
        result.current.handleFieldChange('contactEmail', 'john@example.com');
      });
      act(() => {
        result.current.handleFieldChange('projectName', 'My Project');
      });
      act(() => {
        result.current.handleFieldChange('projectType', 'Web Application');
      });
      act(() => {
        result.current.handleFieldChange('projectDescription', 'Build a comprehensive web application with modern features and functionality');
      });
      act(() => {
        result.current.handleFieldChange('features', 'User authentication, Dashboard, Analytics, API integration');
      });
      act(() => {
        result.current.handleFieldChange('timeline', '3-6 months');
      });
      act(() => {
        result.current.handleFieldChange('budget', '$10,000 - $25,000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.formType).toBe('technical');
    });

    test('should reset isSubmitting after successful submit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Fill all required fields
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
      });
      act(() => {
        result.current.handleFieldChange('contactEmail', 'john@example.com');
      });
      act(() => {
        result.current.handleFieldChange('projectName', 'My Project');
      });
      act(() => {
        result.current.handleFieldChange('projectType', 'Web Application');
      });
      act(() => {
        result.current.handleFieldChange('projectDescription', 'Build a comprehensive web application with modern features and functionality');
      });
      act(() => {
        result.current.handleFieldChange('features', 'User authentication, Dashboard, Analytics');
      });
      act(() => {
        result.current.handleFieldChange('timeline', '3-6 months');
      });
      act(() => {
        result.current.handleFieldChange('budget', '$10,000 - $25,000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('handleSubmit - Network Errors', () => {
    test('should handle network error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Fill all required fields
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
      });
      act(() => {
        result.current.handleFieldChange('contactEmail', 'john@example.com');
      });
      act(() => {
        result.current.handleFieldChange('projectName', 'My Project');
      });
      act(() => {
        result.current.handleFieldChange('projectType', 'Web Application');
      });
      act(() => {
        result.current.handleFieldChange('projectDescription', 'Build a comprehensive web application with modern features');
      });
      act(() => {
        result.current.handleFieldChange('features', 'User authentication, Dashboard');
      });
      act(() => {
        result.current.handleFieldChange('timeline', '3-6 months');
      });
      act(() => {
        result.current.handleFieldChange('budget', '$10,000 - $25,000');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(global.alert).toHaveBeenCalledWith(
        'There was an error sending your requirements. Please email luka@sunny-stack.com directly.'
      );
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('resetForm', () => {
    test('should reset all form fields to empty', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Fill form
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
        result.current.handleFieldChange('contactEmail', 'john@example.com');
        result.current.handleFieldChange('projectDescription', 'A project');
      });

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.contactName).toBe('');
      expect(result.current.formData.contactEmail).toBe('');
      expect(result.current.formData.projectDescription).toBe('');
    });

    test('should clear all errors', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Trigger validation errors
      act(() => {
        result.current.handleSubmit();
      });

      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.errors).toEqual({});
    });

    test('should reset all 16 form fields', () => {
      const { result } = renderHook(() => useTechnicalForm(mockOnComplete));

      // Fill all fields
      act(() => {
        result.current.handleFieldChange('contactName', 'John Doe');
        result.current.handleFieldChange('contactEmail', 'john@example.com');
        result.current.handleFieldChange('companyName', 'Acme Corp');
        result.current.handleFieldChange('projectName', 'Project X');
        result.current.handleFieldChange('projectType', 'Web App');
        result.current.handleFieldChange('projectDescription', 'Description');
        result.current.handleFieldChange('targetAudience', 'Developers');
        result.current.handleFieldChange('primaryGoals', 'Goals');
        result.current.handleFieldChange('techStack', 'React');
        result.current.handleFieldChange('hostingPreference', 'AWS');
        result.current.handleFieldChange('budget', '10000');
        result.current.handleFieldChange('timeline', '3 months');
        result.current.handleFieldChange('features', 'Features');
        result.current.handleFieldChange('integrations', 'Integrations');
        result.current.handleFieldChange('designStatus', 'In progress');
        result.current.handleFieldChange('additionalNotes', 'Notes');
      });

      // Reset
      act(() => {
        result.current.resetForm();
      });

      // Check all fields are empty
      expect(result.current.formData.contactName).toBe('');
      expect(result.current.formData.contactEmail).toBe('');
      expect(result.current.formData.companyName).toBe('');
      expect(result.current.formData.projectName).toBe('');
      expect(result.current.formData.projectType).toBe('');
      expect(result.current.formData.projectDescription).toBe('');
      expect(result.current.formData.targetAudience).toBe('');
      expect(result.current.formData.primaryGoals).toBe('');
      expect(result.current.formData.techStack).toBe('');
      expect(result.current.formData.hostingPreference).toBe('');
      expect(result.current.formData.budget).toBe('');
      expect(result.current.formData.timeline).toBe('');
      expect(result.current.formData.features).toBe('');
      expect(result.current.formData.integrations).toBe('');
      expect(result.current.formData.designStatus).toBe('');
      expect(result.current.formData.additionalNotes).toBe('');
    });
  });

});
