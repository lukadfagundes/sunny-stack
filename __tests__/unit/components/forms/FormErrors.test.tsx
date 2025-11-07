/**
 * Unit Tests for FormErrors Component
 */

import { render, screen } from '@testing-library/react';
import FormErrors from '@/components/forms/FormErrors';

describe('FormErrors', () => {
  describe('Rendering', () => {
    test('should not render when no errors', () => {
      const { container } = render(<FormErrors errors={{}} />);
      expect(container.firstChild).toBeNull();
    });

    test('should render error container when errors exist', () => {
      const errors = { email: 'Email is required' };
      render(<FormErrors errors={errors} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Please correct the following errors:')).toBeInTheDocument();
    });

    test('should render single error', () => {
      const errors = { email: 'Email is required' };
      render(<FormErrors errors={errors} />);

      expect(screen.getByText(/Email/)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/)).toBeInTheDocument();
    });

    test('should render multiple errors', () => {
      const errors = {
        email: 'Email is required',
        password: 'Password must be at least 8 characters',
        name: 'Name is required',
      };
      render(<FormErrors errors={errors} />);

      expect(screen.getByText(/Email/)).toBeInTheDocument();
      expect(screen.getByText(/Password/)).toBeInTheDocument();
      expect(screen.getByText(/Name/)).toBeInTheDocument();
    });

    test('should format camelCase field names with spaces', () => {
      const errors = { projectDescription: 'Description is required' };
      render(<FormErrors errors={errors} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem.textContent).toContain('project Description');
      expect(listItem.textContent).toContain('Description is required');
    });

    test('should capitalize field names', () => {
      const errors = { email: 'Email is required' };
      render(<FormErrors errors={errors} />);

      const listItem = screen.getByText(/Email/);
      expect(listItem).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const errors = { email: 'Email is required' };
      const { container } = render(<FormErrors errors={errors} className="custom-class" />);

      const alertDiv = container.querySelector('[role="alert"]');
      expect(alertDiv).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    test('should have role="alert"', () => {
      const errors = { email: 'Email is required' };
      render(<FormErrors errors={errors} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    test('should have aria-live="polite"', () => {
      const errors = { email: 'Email is required' };
      const { container } = render(<FormErrors errors={errors} />);

      const alert = container.querySelector('[aria-live="polite"]');
      expect(alert).toBeInTheDocument();
    });

    test('should render errors as list', () => {
      const errors = {
        email: 'Email is required',
        password: 'Password is required',
      };
      render(<FormErrors errors={errors} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
    });
  });

  describe('Error Message Format', () => {
    test('should display field name and error message separated by colon', () => {
      const errors = { email: 'Email is required' };
      render(<FormErrors errors={errors} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem.textContent).toContain('Email');
      expect(listItem.textContent).toContain(':');
      expect(listItem.textContent).toContain('Email is required');
    });

    test('should handle complex field names', () => {
      const errors = { contactEmail: 'Invalid email format' };
      render(<FormErrors errors={errors} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem.textContent).toContain('contact Email');
      expect(listItem.textContent).toContain('Invalid email format');
    });

    test('should handle multiple capital letters', () => {
      const errors = { URLPath: 'URL is invalid' };
      render(<FormErrors errors={errors} />);

      expect(screen.getByText(/U R L Path/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('should have red background and border', () => {
      const errors = { email: 'Email is required' };
      const { container } = render(<FormErrors errors={errors} />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('bg-red-50');
      expect(alert).toHaveClass('border-red-300');
    });

    test('should have rounded corners', () => {
      const errors = { email: 'Email is required' };
      const { container } = render(<FormErrors errors={errors} />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('rounded-lg');
    });

    test('should have padding', () => {
      const errors = { email: 'Email is required' };
      const { container } = render(<FormErrors errors={errors} />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('p-4');
    });
  });
});
