/**
 * Unit Tests for ProjectSection Component
 *
 * Tests the project type and description sections of the guided quote form
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectSection } from '@/components/quote/sections/ProjectSection';
import type { GuidedFormData } from '@/lib/quote-types';

describe('ProjectSection', () => {
  const mockOnChange = jest.fn();
  const defaultData: Partial<GuidedFormData> = {
    projectType: undefined,
    projectDescription: '',
  };
  const defaultErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Type Selection (currentField="projectType")', () => {
    test('should render section heading', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      expect(screen.getByText('What are we building?')).toBeInTheDocument();
      expect(screen.getByText('Choose the option that best describes your project')).toBeInTheDocument();
    });

    test('should render all project type options', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('Web App')).toBeInTheDocument();
      expect(screen.getByText('Desktop App')).toBeInTheDocument();
      expect(screen.getByText('Mobile App')).toBeInTheDocument();
      expect(screen.getByText('E-Commerce')).toBeInTheDocument();
      expect(screen.getByText('Something Else')).toBeInTheDocument();
    });

    test('should render project type descriptions', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      expect(screen.getByText('Marketing site, portfolio, blog')).toBeInTheDocument();
      expect(screen.getByText('Interactive application, SaaS, dashboard')).toBeInTheDocument();
      expect(screen.getByText('Windows, Mac, or cross-platform')).toBeInTheDocument();
      expect(screen.getByText('iOS, Android, or cross-platform')).toBeInTheDocument();
      expect(screen.getByText('Online store, marketplace, payments')).toBeInTheDocument();
      expect(screen.getByText('API, automation, or custom solution')).toBeInTheDocument();
    });

    test('should highlight selected project type', () => {
      const data: Partial<GuidedFormData> = {
        projectType: 'webapp',
      };

      render(
        <ProjectSection
          data={data}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      const selectedButton = screen.getByText('Web App').closest('button');
      expect(selectedButton).toHaveClass('border-sunny-red', 'bg-sunny-red/10');
    });

    test('should display error message', () => {
      const errors = {
        projectType: 'Please select a project type',
      };

      render(
        <ProjectSection
          data={defaultData}
          errors={errors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      expect(screen.getByText('Please select a project type')).toBeInTheDocument();
    });

    test('should call onChange when project type is clicked', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      const websiteButton = screen.getByText('Website').closest('button');
      fireEvent.click(websiteButton!);

      expect(mockOnChange).toHaveBeenCalledWith({ projectType: 'website' });
    });

    test('should render 6 project type options', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6);
    });
  });

  describe('Project Description (currentField="description")', () => {
    test('should render description heading', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      expect(screen.getByText('Tell me about your vision')).toBeInTheDocument();
      expect(screen.getByText("Don't worry about technical terms - just describe what you want!")).toBeInTheDocument();
    });

    test('should render description textarea', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      const textarea = screen.getByLabelText(/Project Description/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    test('should display pre-filled description', () => {
      const data: Partial<GuidedFormData> = {
        projectDescription: 'Build a mobile app for task management',
      };

      render(
        <ProjectSection
          data={data}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      expect(screen.getByDisplayValue('Build a mobile app for task management')).toBeInTheDocument();
    });

    test('should call onChange when description changes', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      const textarea = screen.getByLabelText(/Project Description/i);
      fireEvent.change(textarea, { target: { value: 'New project description' } });

      expect(mockOnChange).toHaveBeenCalledWith({ projectDescription: 'New project description' });
    });

    test('should display description error message', () => {
      const errors = {
        projectDescription: 'Description is required',
      };

      render(
        <ProjectSection
          data={defaultData}
          errors={errors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    test('should have placeholder text', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      expect(screen.getByPlaceholderText(/I want to build an app/i)).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    test('should show project type selection when currentField is projectType', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      expect(screen.getByText('What are we building?')).toBeInTheDocument();
      expect(screen.queryByText('Tell me about your vision')).not.toBeInTheDocument();
    });

    test('should show description when currentField is description', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="description"
        />
      );

      expect(screen.getByText('Tell me about your vision')).toBeInTheDocument();
      expect(screen.queryByText('What are we building?')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions for All Project Types', () => {
    test('should handle all project type selections', () => {
      render(
        <ProjectSection
          data={defaultData}
          errors={defaultErrors}
          onChange={mockOnChange}
          currentField="projectType"
        />
      );

      const projectTypes = [
        { label: 'Website', value: 'website' },
        { label: 'Web App', value: 'webapp' },
        { label: 'Desktop App', value: 'desktop' },
        { label: 'Mobile App', value: 'mobile' },
        { label: 'E-Commerce', value: 'ecommerce' },
        { label: 'Something Else', value: 'other' },
      ];

      projectTypes.forEach((type) => {
        const button = screen.getByText(type.label).closest('button');
        fireEvent.click(button!);
        expect(mockOnChange).toHaveBeenCalledWith({ projectType: type.value });
      });

      expect(mockOnChange).toHaveBeenCalledTimes(6);
    });
  });
});
