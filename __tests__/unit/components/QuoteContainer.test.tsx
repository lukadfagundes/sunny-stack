import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
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
  it('renders mode selector initially', async () => {
    await act(async () => {
      render(<QuoteContainer />)
      // Wait for dynamic imports to resolve
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
  })

  it('switches to guided form when guided mode is selected', async () => {
    await act(async () => {
      render(<QuoteContainer />)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Select Guided'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByTestId('guided-form')).toBeInTheDocument()
    expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
  })

  it('switches to technical form when technical mode is selected', async () => {
    await act(async () => {
      render(<QuoteContainer />)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Select Technical'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByTestId('technical-form')).toBeInTheDocument()
    expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
  })

  it('returns to mode selector when back is clicked from guided form', async () => {
    await act(async () => {
      render(<QuoteContainer />)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Select Guided'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Back from Guided'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('guided-form')).not.toBeInTheDocument()
  })

  it('returns to mode selector when complete is clicked from guided form', async () => {
    await act(async () => {
      render(<QuoteContainer />)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Select Guided'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Complete Guided'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('guided-form')).not.toBeInTheDocument()
  })

  it('returns to mode selector when back is clicked from technical form', async () => {
    await act(async () => {
      render(<QuoteContainer />)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Select Technical'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Back from Technical'))
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
    expect(screen.queryByTestId('technical-form')).not.toBeInTheDocument()
  })
})