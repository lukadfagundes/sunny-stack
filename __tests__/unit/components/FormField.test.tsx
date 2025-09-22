// __tests__/unit/components/FormField.test.tsx

import { render, screen, fireEvent } from '@testing-library/react'
import FormField from '@/components/forms/FormField'

describe('FormField Component', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  test('renders with label and input', () => {
    render(
      <FormField
        label="Test Field"
        name="testField"
        value=""
        onChange={mockOnChange}
      />
    )

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  test('shows required indicator when required', () => {
    render(
      <FormField
        label="Required Field"
        name="requiredField"
        value=""
        onChange={mockOnChange}
        required
      />
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  test('displays error message when error prop is provided', () => {
    render(
      <FormField
        label="Error Field"
        name="errorField"
        value=""
        onChange={mockOnChange}
        error="This field has an error"
      />
    )

    expect(screen.getByText('This field has an error')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('calls onChange when input value changes', () => {
    render(
      <FormField
        label="Change Field"
        name="changeField"
        value=""
        onChange={mockOnChange}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new value' } })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  test('applies custom className', () => {
    const { container } = render(
      <FormField
        label="Custom Class"
        name="customClass"
        value=""
        onChange={mockOnChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})