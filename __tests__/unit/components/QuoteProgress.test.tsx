import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import QuoteProgress from '@/components/quote/QuoteProgress'

describe('QuoteProgress', () => {
  const mockOnBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders progress bar with correct step information', () => {
    render(
      <QuoteProgress currentStep={2} totalSteps={5} onBack={mockOnBack} />
    )

    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()
  })

  it('calculates progress percentage correctly', () => {
    const { container } = render(
      <QuoteProgress currentStep={1} totalSteps={4} onBack={mockOnBack} />
    )

    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('calls onBack when back button is clicked', () => {
    render(
      <QuoteProgress currentStep={1} totalSteps={5} onBack={mockOnBack} />
    )

    fireEvent.click(screen.getByLabelText('Go back'))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('displays correct aria attributes for accessibility', () => {
    const { container } = render(
      <QuoteProgress currentStep={2} totalSteps={6} onBack={mockOnBack} />
    )

    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveAttribute('aria-valuenow', '3')
    expect(progressBar).toHaveAttribute('aria-valuemin', '1')
    expect(progressBar).toHaveAttribute('aria-valuemax', '6')
  })

  it('renders at 100% width for last step', () => {
    const { container } = render(
      <QuoteProgress currentStep={3} totalSteps={4} onBack={mockOnBack} />
    )

    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveStyle({ width: '100%' })
  })
})