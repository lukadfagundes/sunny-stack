import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import QuoteContainer from '@/components/quote/QuoteContainer'

// Mock the child components
jest.mock('@/components/quote/QuoteModeSelector', () => {
  return function MockQuoteModeSelector({ onModeSelect }: any) {
    return (
      <div data-testid="mode-selector">
        <button onClick={() => onModeSelect('guided')}>Select Guided</button>
        <button onClick={() => onModeSelect('technical')}>Select Technical</button>
      </div>
    )
  }
})

jest.mock('@/components/quote/GuidedQuoteForm', () => {
  return function MockGuidedQuoteForm({ onBack, onComplete }: any) {
    return (
      <div data-testid="guided-form">
        <button onClick={onBack}>Back from Guided</button>
        <button onClick={onComplete}>Complete Guided</button>
      </div>
    )
  }
})

jest.mock('@/components/quote/TechnicalQuoteForm', () => {
  return function MockTechnicalQuoteForm({ onBack, onComplete }: any) {
    return (
      <div data-testid="technical-form">
        <button onClick={onBack}>Back from Technical</button>
        <button onClick={onComplete}>Complete Technical</button>
      </div>
    )
  }
})

describe('QuoteContainer', () => {
  it('renders mode selector initially', () => {
    render(<QuoteContainer />)
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
  })

  it('switches to guided form when guided mode is selected', () => {
    render(<QuoteContainer />)

    fireEvent.click(screen.getByText('Select Guided'))

    expect(screen.getByTestId('guided-form')).toBeInTheDocument()
    expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
  })

  it('switches to technical form when technical mode is selected', () => {
    render(<QuoteContainer />)

    fireEvent.click(screen.getByText('Select Technical'))

    expect(screen.getByTestId('technical-form')).toBeInTheDocument()
    expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
  })

  it('returns to mode selector when back is clicked from guided form', () => {
    render(<QuoteContainer />)

    fireEvent.click(screen.getByText('Select Guided'))
    fireEvent.click(screen.getByText('Back from Guided'))

    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('guided-form')).not.toBeInTheDocument()
  })

  it('returns to mode selector when complete is clicked from guided form', () => {
    render(<QuoteContainer />)

    fireEvent.click(screen.getByText('Select Guided'))
    fireEvent.click(screen.getByText('Complete Guided'))

    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('guided-form')).not.toBeInTheDocument()
  })

  it('returns to mode selector when back is clicked from technical form', () => {
    render(<QuoteContainer />)

    fireEvent.click(screen.getByText('Select Technical'))
    fireEvent.click(screen.getByText('Back from Technical'))

    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('technical-form')).not.toBeInTheDocument()
  })
})