/**
 * Unit Tests for ContactSection Component
 *
 * Tests the contact information section of the guided quote form
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ContactSection } from '@/components/quote/sections/ContactSection';
import type { GuidedFormData } from '@/lib/quote-types';

describe('ContactSection', () => {
  const mockOnChange = jest.fn();
  const defaultData: Partial<GuidedFormData> = {
    name: '',
    email: '',
    company: '',
  };
  const defaultErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render section heading', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Let's start with introductions!")).toBeInTheDocument();
      expect(screen.getByText("How can I reach you about this project?")).toBeInTheDocument();
    });

    test('should render all form fields', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Company \(Optional\)/i)).toBeInTheDocument();
    });

    test('should render with pre-filled data', () => {
      const data: Partial<GuidedFormData> = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
      };

      render(
        <ContactSection
          data={data}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });

    test('should display error messages', () => {
      const errors = {
        name: 'Name is required',
        email: 'Invalid email format',
      };

      render(
        <ContactSection
          data={defaultData}
          errors={errors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should call onChange when name input changes', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByLabelText(/Your Name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

      expect(mockOnChange).toHaveBeenCalledWith({ name: 'Jane Smith' });
    });

    test('should call onChange when email input changes', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

      expect(mockOnChange).toHaveBeenCalledWith({ email: 'jane@example.com' });
    });

    test('should call onChange when company input changes', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const companyInput = screen.getByLabelText(/Company \(Optional\)/i);
      fireEvent.change(companyInput, { target: { value: 'New Corp' } });

      expect(mockOnChange).toHaveBeenCalledWith({ company: 'New Corp' });
    });

    test('should handle empty values', () => {
      const data: Partial<GuidedFormData> = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      render(
        <ContactSection
          data={data}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByLabelText(/Your Name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith({ name: '' });
    });
  });

  describe('Field Attributes', () => {
    test('name field should exist and be in the document', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByLabelText(/Your Name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput.tagName).toBe('INPUT');
    });

    test('email field should have email type', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('company field should be optional (marked in label)', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      // Check that the label contains "(Optional)"
      expect(screen.getByText(/Company \(Optional\)/i)).toBeInTheDocument();
    });

    test('should have correct placeholders', () => {
      render(
        <ContactSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Awesome Corp')).toBeInTheDocument();
    });
  });
});
