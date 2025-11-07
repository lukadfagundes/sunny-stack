/**
 * Unit Tests for BudgetSection Component
 *
 * Tests the budget range selection section of the guided quote form
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetSection } from '@/components/quote/sections/BudgetSection';
import type { GuidedFormData } from '@/lib/quote-types';

describe('BudgetSection', () => {
  const mockOnChange = jest.fn();
  const defaultData: Partial<GuidedFormData> = {
    budget: undefined,
  };
  const defaultErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render section heading', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Budget range')).toBeInTheDocument();
      expect(screen.getByText('This helps me suggest the best solution for your needs')).toBeInTheDocument();
    });

    test('should render all budget options', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Under $5,000')).toBeInTheDocument();
      expect(screen.getByText('$5,000 - $10,000')).toBeInTheDocument();
      expect(screen.getByText('$10,000 - $25,000')).toBeInTheDocument();
      expect(screen.getByText('$25,000+')).toBeInTheDocument();
    });

    test('should render budget descriptions', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Essential features, MVP')).toBeInTheDocument();
      expect(screen.getByText('Full-featured solution')).toBeInTheDocument();
      expect(screen.getByText('Complex application')).toBeInTheDocument();
      expect(screen.getByText('Enterprise solution')).toBeInTheDocument();
    });

    test('should highlight selected budget option', () => {
      const data: Partial<GuidedFormData> = {
        budget: '5k-10k',
      };

      render(
        <BudgetSection
          data={data}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const selectedButton = screen.getByText('$5,000 - $10,000').closest('button');
      expect(selectedButton).toHaveClass('border-sunny-red', 'bg-sunny-red/10');
    });

    test('should display error message', () => {
      const errors = {
        budget: 'Please select a budget range',
      };

      render(
        <BudgetSection
          data={defaultData}
          errors={errors}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Please select a budget range')).toBeInTheDocument();
    });

    test('should apply error styling when error exists', () => {
      const errors = {
        budget: 'Please select a budget range',
      };

      render(
        <BudgetSection
          data={defaultData}
          errors={errors}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('border-red-500');
      });
    });
  });

  describe('User Interactions', () => {
    test('should call onChange when budget option is clicked', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const budgetButton = screen.getByText('Under $5,000').closest('button');
      fireEvent.click(budgetButton!);

      expect(mockOnChange).toHaveBeenCalledWith({ budget: 'under5k' });
    });

    test('should call onChange for each budget option', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const budgetOptions = [
        { label: 'Under $5,000', value: 'under5k' },
        { label: '$5,000 - $10,000', value: '5k-10k' },
        { label: '$10,000 - $25,000', value: '10k-25k' },
        { label: '$25,000+', value: '25k+' },
      ];

      budgetOptions.forEach((option) => {
        const button = screen.getByText(option.label).closest('button');
        fireEvent.click(button!);
        expect(mockOnChange).toHaveBeenCalledWith({ budget: option.value });
      });

      expect(mockOnChange).toHaveBeenCalledTimes(4);
    });

    test('should allow changing selection', () => {
      const { rerender } = render(
        <BudgetSection
          data={{ budget: 'under5k' }}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const newBudgetButton = screen.getByText('$10,000 - $25,000').closest('button');
      fireEvent.click(newBudgetButton!);

      expect(mockOnChange).toHaveBeenCalledWith({ budget: '10k-25k' });
    });
  });

  describe('Accessibility', () => {
    test('all budget options should be buttons', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    test('buttons should have proper structure', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Budget Options Coverage', () => {
    test('should include all expected budget ranges', () => {
      render(
        <BudgetSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);

      const labels = buttons.map(b => b.textContent);
      expect(labels.some(l => l?.includes('Under $5,000'))).toBe(true);
      expect(labels.some(l => l?.includes('$5,000 - $10,000'))).toBe(true);
      expect(labels.some(l => l?.includes('$10,000 - $25,000'))).toBe(true);
      expect(labels.some(l => l?.includes('$25,000+'))).toBe(true);
    });
  });
});
