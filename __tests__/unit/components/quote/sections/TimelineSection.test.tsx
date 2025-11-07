/**
 * Unit Tests for TimelineSection Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineSection } from '@/components/quote/sections/TimelineSection';
import type { GuidedFormData } from '@/lib/quote-types';

describe('TimelineSection', () => {
  const mockOnChange = jest.fn();
  const defaultData: Partial<GuidedFormData> = { timeline: undefined };
  const defaultErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render section heading', () => {
    render(<TimelineSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    expect(screen.getByText('When do you need this?')).toBeInTheDocument();
    expect(screen.getByText('This helps me prioritize and plan accordingly')).toBeInTheDocument();
  });

  test('should render all timeline options', () => {
    render(<TimelineSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    expect(screen.getByText('ASAP')).toBeInTheDocument();
    expect(screen.getByText('Within 1 month')).toBeInTheDocument();
    expect(screen.getByText('Within 3 months')).toBeInTheDocument();
    expect(screen.getByText('Flexible')).toBeInTheDocument();
  });

  test('should highlight selected timeline', () => {
    const data: Partial<GuidedFormData> = { timeline: '1month' };
    render(<TimelineSection data={data} errors={defaultErrors} onChange={mockOnChange} />);

    const selectedButton = screen.getByText('Within 1 month').closest('button');
    expect(selectedButton).toHaveClass('border-sunny-red', 'bg-sunny-red/10');
  });

  test('should call onChange when timeline is selected', () => {
    render(<TimelineSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    const asapButton = screen.getByText('ASAP').closest('button');
    fireEvent.click(asapButton!);

    expect(mockOnChange).toHaveBeenCalledWith({ timeline: 'asap' });
  });

  test('should display error message', () => {
    const errors = { timeline: 'Please select a timeline' };
    render(<TimelineSection data={defaultData} errors={errors} onChange={mockOnChange} />);

    expect(screen.getByText('Please select a timeline')).toBeInTheDocument();
  });

  test('should have 4 timeline options', () => {
    render(<TimelineSection data={defaultData} errors={defaultErrors} onChange={mockOnChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });
});
