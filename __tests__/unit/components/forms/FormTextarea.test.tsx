/**
 * Unit Tests for FormTextarea Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import FormTextarea from '@/components/forms/FormTextarea';

describe('FormTextarea', () => {
  const mockOnChange = jest.fn();

  const defaultProps = {
    label: 'Test Textarea',
    name: 'testTextarea',
    value: '',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    test('should render label', () => {
      render(<FormTextarea {...defaultProps} />);
      expect(screen.getByText('Test Textarea')).toBeInTheDocument();
    });

    test('should render textarea element', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    test('should render with placeholder', () => {
      render(<FormTextarea {...defaultProps} placeholder="Enter text here" />);
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    test('should render required indicator when required', () => {
      render(<FormTextarea {...defaultProps} required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-sunny-red');
    });

    test('should not render required indicator when not required', () => {
      render(<FormTextarea {...defaultProps} />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(<FormTextarea {...defaultProps} className="custom-class" />);
      const div = container.firstChild;
      expect(div).toHaveClass('custom-class');
    });

    test('should render with default rows', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    test('should render with custom rows', () => {
      render(<FormTextarea {...defaultProps} rows={10} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    test('should set maxLength attribute', () => {
      render(<FormTextarea {...defaultProps} maxLength={500} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    test('should not set maxLength when not provided', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toHaveAttribute('maxLength');
    });
  });

  describe('User Interaction', () => {
    test('should call onChange when text is entered', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    test('should display entered value', () => {
      const { rerender } = render(<FormTextarea {...defaultProps} value="" />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      expect(textarea.value).toBe('');

      rerender(<FormTextarea {...defaultProps} value="Updated text" />);

      expect(textarea.value).toBe('Updated text');
    });

    test('should handle multiline text', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      render(<FormTextarea {...defaultProps} value={multilineText} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      expect(textarea.value).toBe(multilineText);
    });

    test('should respect maxLength constraint', () => {
      render(<FormTextarea {...defaultProps} maxLength={10} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: 'This is a very long text' } });

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should render error message', () => {
      render(<FormTextarea {...defaultProps} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should not render error message when no error', () => {
      render(<FormTextarea {...defaultProps} />);
      const errorElement = screen.queryByRole('alert');
      expect(errorElement).not.toBeInTheDocument();
    });

    test('should apply error styles to textarea', () => {
      render(<FormTextarea {...defaultProps} error="Error message" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });

    test('should set aria-invalid when error exists', () => {
      render(<FormTextarea {...defaultProps} error="Error message" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    test('should set aria-describedby when error exists', () => {
      render(<FormTextarea {...defaultProps} error="Error message" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-describedby', 'testTextarea-error');
    });

    test('should not set aria-describedby when no error', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toHaveAttribute('aria-describedby');
    });

    test('error message should have proper id', () => {
      render(<FormTextarea {...defaultProps} error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveAttribute('id', 'testTextarea-error');
    });
  });

  describe('Accessibility', () => {
    test('should have proper label association', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('id', 'testTextarea');
      expect(textarea).toHaveAttribute('name', 'testTextarea');
    });

    test('should have label with htmlFor attribute', () => {
      const { container } = render(<FormTextarea {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('for', 'testTextarea');
    });

    test('error message should have role="alert"', () => {
      render(<FormTextarea {...defaultProps} error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    test('error message should have aria-live="polite"', () => {
      render(<FormTextarea {...defaultProps} error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    test('should set aria-invalid to false when no error', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Styling', () => {
    test('should apply focus styles', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('focus:outline-none');
      expect(textarea).toHaveClass('focus:ring-2');
    });

    test('should apply default border color when no error', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-sunny-gold/30');
    });

    test('should apply error border color when error exists', () => {
      render(<FormTextarea {...defaultProps} error="Error" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500');
    });

    test('should have transition classes', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('transition-colors');
      expect(textarea).toHaveClass('duration-200');
    });

    test('should have proper padding and border radius', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('px-3');
      expect(textarea).toHaveClass('py-2');
      expect(textarea).toHaveClass('rounded-lg');
    });

    test('should have white background', () => {
      render(<FormTextarea {...defaultProps} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('bg-white');
    });
  });

  describe('Value Handling', () => {
    test('should handle empty value', () => {
      render(<FormTextarea {...defaultProps} value="" />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    test('should handle long text values', () => {
      const longText = 'a'.repeat(1000);
      render(<FormTextarea {...defaultProps} value={longText} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longText);
    });

    test('should handle special characters', () => {
      const specialText = '<script>alert("test")</script>\n\t';
      render(<FormTextarea {...defaultProps} value={specialText} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialText);
    });
  });
});
