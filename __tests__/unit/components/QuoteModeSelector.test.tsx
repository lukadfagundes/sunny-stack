import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import QuoteModeSelector from '@/components/quote/QuoteModeSelector'

describe('QuoteModeSelector', () => {
  const mockOnModeSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders both mode selection options', () => {
    render(<QuoteModeSelector onModeSelect={mockOnModeSelect} />)

    expect(screen.getByText("I'll Walk You Through It")).toBeInTheDocument()
    expect(screen.getByText('I Know What I Need')).toBeInTheDocument()
  })

  it('renders title and subtitle', () => {
    render(<QuoteModeSelector onModeSelect={mockOnModeSelect} />)

    expect(screen.getByText("Let's Build Something Amazing")).toBeInTheDocument()
    expect(screen.getByText("Choose how you'd like to describe your project")).toBeInTheDocument()
  })

  it('calls onModeSelect with "guided" when guided option is clicked', () => {
    render(<QuoteModeSelector onModeSelect={mockOnModeSelect} />)

    const guidedButton = screen.getByLabelText('Start guided quote process')
    fireEvent.click(guidedButton)

    expect(mockOnModeSelect).toHaveBeenCalledWith('guided')
    expect(mockOnModeSelect).toHaveBeenCalledTimes(1)
  })

  it('calls onModeSelect with "technical" when technical option is clicked', () => {
    render(<QuoteModeSelector onModeSelect={mockOnModeSelect} />)

    const technicalButton = screen.getByLabelText('Start technical quote process')
    fireEvent.click(technicalButton)

    expect(mockOnModeSelect).toHaveBeenCalledWith('technical')
    expect(mockOnModeSelect).toHaveBeenCalledTimes(1)
  })

  it('displays correct descriptions for each option', () => {
    render(<QuoteModeSelector onModeSelect={mockOnModeSelect} />)

    expect(screen.getByText(/Perfect if you're not sure about all the technical details/)).toBeInTheDocument()
    expect(screen.getByText(/For those who speak tech/)).toBeInTheDocument()
  })

  it('renders correct icons for each option', () => {
    render(<QuoteModeSelector onModeSelect={mockOnModeSelect} />)

    // Check for the presence of the action text with icons
    expect(screen.getByText('Start Guided Process')).toBeInTheDocument()
    expect(screen.getByText('Get Technical Doc')).toBeInTheDocument()
  })
})
