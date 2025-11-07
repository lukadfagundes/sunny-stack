/**
 * Unit Tests for RequirementsSection Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementsSection } from '@/components/quote/sections/RequirementsSection';
import type { GuidedFormData } from '@/lib/quote-types';

describe('RequirementsSection', () => {
  const mockOnChange = jest.fn();
  const defaultData: Partial<GuidedFormData> = { features: [] };
  const defaultErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render section heading', () => {
    render(<RequirementsSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    expect(screen.getByText('What features do you need?')).toBeInTheDocument();
    expect(screen.getByText('Select all that apply')).toBeInTheDocument();
  });

  test('should render all feature options', () => {
    render(<RequirementsSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    expect(screen.getByText('User accounts/login')).toBeInTheDocument();
    expect(screen.getByText('Payment processing')).toBeInTheDocument();
    expect(screen.getByText('Email notifications')).toBeInTheDocument();
    expect(screen.getByText('File uploads')).toBeInTheDocument();
    expect(screen.getByText('Search functionality')).toBeInTheDocument();
    expect(screen.getByText('Admin dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics/reporting')).toBeInTheDocument();
    expect(screen.getByText('Third-party integrations')).toBeInTheDocument();
    expect(screen.getByText('Real-time updates')).toBeInTheDocument();
    expect(screen.getByText('Mobile responsive')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  test('should handle feature selection', () => {
    render(<RequirementsSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    const userAccountsCheckbox = screen.getByLabelText('User accounts/login');
    fireEvent.click(userAccountsCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({ features: ['User accounts/login'] });
  });

  test('should handle feature deselection', () => {
    const data: Partial<GuidedFormData> = { features: ['User accounts/login', 'Payment processing'] };
    render(<RequirementsSection data={data} errors={defaultErrors} onChange={mockOnChange} />);

    const userAccountsCheckbox = screen.getByLabelText('User accounts/login');
    fireEvent.click(userAccountsCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({ features: ['Payment processing'] });
  });

  test('should check selected features', () => {
    const data: Partial<GuidedFormData> = { features: ['User accounts/login', 'Email notifications'] };
    render(<RequirementsSection data={data} errors={defaultErrors} onChange={mockOnChange} />);

    const userAccountsCheckbox = screen.getByLabelText('User accounts/login') as HTMLInputElement;
    const emailCheckbox = screen.getByLabelText('Email notifications') as HTMLInputElement;
    const paymentsCheckbox = screen.getByLabelText('Payment processing') as HTMLInputElement;

    expect(userAccountsCheckbox.checked).toBe(true);
    expect(emailCheckbox.checked).toBe(true);
    expect(paymentsCheckbox.checked).toBe(false);
  });

  test('should show "Other" input when Other is selected', () => {
    render(<RequirementsSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    const otherCheckbox = screen.getByLabelText('Other');
    fireEvent.click(otherCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({ features: ['Other: '] });
  });

  test('should handle Other feature text input', () => {
    const data: Partial<GuidedFormData> = { features: ['Other: '] };
    render(<RequirementsSection data={data} errors={defaultErrors} onChange={mockOnChange} />);

    const otherInput = screen.getByPlaceholderText('Please describe what else you need...');
    fireEvent.change(otherInput, { target: { value: 'Custom reporting' } });

    expect(mockOnChange).toHaveBeenCalledWith({ features: ['Other: Custom reporting'] });
  });

  test('should display Other input value correctly', () => {
    const data: Partial<GuidedFormData> = { features: ['Other: Custom feature'] };
    render(<RequirementsSection data={data} errors={defaultErrors} onChange={mockOnChange} />);

    const otherInput = screen.getByPlaceholderText('Please describe what else you need...') as HTMLInputElement;
    expect(otherInput.value).toBe('Custom feature');
  });

  test('should have 11 checkboxes', () => {
    render(<RequirementsSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(11);
  });

  test('should handle multiple selections', () => {
    render(<RequirementsSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    const userAccountsCheckbox = screen.getByLabelText('User accounts/login');
    const paymentCheckbox = screen.getByLabelText('Payment processing');

    fireEvent.click(userAccountsCheckbox);
    fireEvent.click(paymentCheckbox);

    expect(mockOnChange).toHaveBeenNthCalledWith(1, { features: ['User accounts/login'] });
    expect(mockOnChange).toHaveBeenNthCalledWith(2, { features: ['Payment processing'] });
  });

  test('should remove Other input when unchecked', () => {
    const data: Partial<GuidedFormData> = { features: ['User accounts/login', 'Other: Custom'] };
    render(<RequirementsSection data={data} errors={defaultErrors} onChange={mockOnChange} />);

    const otherCheckbox = screen.getByLabelText('Other');
    fireEvent.click(otherCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith({ features: ['User accounts/login'] });
  });
});
