/**
 * Unit Tests for FormSelect Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import FormSelect from '@/components/forms/FormSelect';

describe('FormSelect', () => {
  const mockOnChange = jest.fn();
  const defaultOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    label: 'Test Select',
    name: 'testSelect',
    value: '',
    onChange: mockOnChange,
    options: defaultOptions,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    test('should render label', () => {
      render(<FormSelect {...defaultProps} />);
      expect(screen.getByText('Test Select')).toBeInTheDocument();
    });

    test('should render select element', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    test('should render placeholder option', () => {
      render(<FormSelect {...defaultProps} placeholder="Choose one" />);
      expect(screen.getByText('Choose one')).toBeInTheDocument();
    });

    test('should render default placeholder', () => {
      render(<FormSelect {...defaultProps} />);
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    test('should render all options', () => {
      render(<FormSelect {...defaultProps} />);
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    test('should render required indicator when required', () => {
      render(<FormSelect {...defaultProps} required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('text-sunny-red');
    });

    test('should not render required indicator when not required', () => {
      render(<FormSelect {...defaultProps} />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(<FormSelect {...defaultProps} className="custom-class" />);
      const div = container.firstChild;
      expect(div).toHaveClass('custom-class');
    });
  });

  describe('User Interaction', () => {
    test('should call onChange when option is selected', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: 'option2' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    test('should update selected value', () => {
      const { rerender } = render(<FormSelect {...defaultProps} value="" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      expect(select.value).toBe('');

      rerender(<FormSelect {...defaultProps} value="option2" />);

      expect(select.value).toBe('option2');
    });

    test('should handle empty value selection', () => {
      render(<FormSelect {...defaultProps} value="option1" />);
      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should render error message', () => {
      render(<FormSelect {...defaultProps} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    test('should not render error message when no error', () => {
      render(<FormSelect {...defaultProps} />);
      const errorElement = screen.queryByRole('alert');
      expect(errorElement).not.toBeInTheDocument();
    });

    test('should apply error styles to select', () => {
      render(<FormSelect {...defaultProps} error="Error message" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
    });

    test('should set aria-invalid when error exists', () => {
      render(<FormSelect {...defaultProps} error="Error message" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    test('should set aria-describedby when error exists', () => {
      render(<FormSelect {...defaultProps} error="Error message" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'testSelect-error');
    });

    test('should not set aria-describedby when no error', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('aria-describedby');
    });

    test('error message should have proper id', () => {
      render(<FormSelect {...defaultProps} error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveAttribute('id', 'testSelect-error');
    });
  });

  describe('Accessibility', () => {
    test('should have proper label association', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'testSelect');
      expect(select).toHaveAttribute('name', 'testSelect');
    });

    test('should have label with htmlFor attribute', () => {
      const { container } = render(<FormSelect {...defaultProps} />);
      const label = container.querySelector('label');
      expect(label).toHaveAttribute('for', 'testSelect');
    });

    test('error message should have role="alert"', () => {
      render(<FormSelect {...defaultProps} error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    test('error message should have aria-live="polite"', () => {
      render(<FormSelect {...defaultProps} error="Error message" />);
      const errorElement = screen.getByText('Error message');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    test('should set aria-invalid to false when no error', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Styling', () => {
    test('should apply focus styles', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('focus:outline-none');
      expect(select).toHaveClass('focus:ring-2');
    });

    test('should apply default border color when no error', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-sunny-gold/30');
    });

    test('should apply error border color when error exists', () => {
      render(<FormSelect {...defaultProps} error="Error" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
    });

    test('should have transition classes', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('transition-colors');
      expect(select).toHaveClass('duration-200');
    });
  });

  describe('Options', () => {
    test('should render empty option first', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('Select an option');
      expect(options[0]).toHaveValue('');
    });

    test('should render options in correct order', () => {
      render(<FormSelect {...defaultProps} />);
      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');

      expect(options[1]).toHaveTextContent('Option 1');
      expect(options[1]).toHaveValue('option1');
      expect(options[2]).toHaveTextContent('Option 2');
      expect(options[2]).toHaveValue('option2');
      expect(options[3]).toHaveTextContent('Option 3');
      expect(options[3]).toHaveValue('option3');
    });

    test('should handle single option', () => {
      const singleOption = [{ value: 'only', label: 'Only Option' }];
      render(<FormSelect {...defaultProps} options={singleOption} />);

      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });

    test('should handle empty options array', () => {
      render(<FormSelect {...defaultProps} options={[]} />);
      const select = screen.getByRole('combobox');
      const options = select.querySelectorAll('option');

      expect(options).toHaveLength(1); // Only placeholder
      expect(options[0]).toHaveTextContent('Select an option');
    });
  });
});
