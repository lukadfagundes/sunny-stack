import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TechnicalFormFields from "@/components/quote/TechnicalFormFields";
import type { TechnicalFormData } from "@/lib/quote-types";

// Mock lucide-react icons as simple spans
jest.mock("lucide-react", () => ({
  ArrowLeft: (props: any) => <span data-testid="icon-arrow-left" {...props} />,
  Send: (props: any) => <span data-testid="icon-send" {...props} />,
}));

/**
 * Creates a default empty TechnicalFormData object for test fixtures.
 * All fields default to empty strings unless overridden.
 */
function createFormData(
  overrides: Partial<TechnicalFormData> = {},
): TechnicalFormData {
  return {
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    projectName: "",
    projectType: "",
    projectDescription: "",
    targetAudience: "",
    primaryGoals: "",
    techStack: "",
    hostingPreference: "",
    budget: "",
    timeline: "",
    features: "",
    integrations: "",
    designStatus: "",
    additionalNotes: "",
    ...overrides,
  };
}

describe("TechnicalFormFields", () => {
  const defaultProps = {
    formData: createFormData(),
    errors: {} as Record<string, string>,
    isSubmitting: false,
    onFieldChange: jest.fn(),
    onSubmit: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders without errors", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(
        screen.getByText("Technical Requirements Form"),
      ).toBeInTheDocument();
    });

    it("renders the back button with arrow icon", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      const backButton = screen.getByText("Back");
      expect(backButton).toBeInTheDocument();
      expect(screen.getByTestId("icon-arrow-left")).toBeInTheDocument();
    });

    it("renders the submit button with send icon", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(
        screen.getByText("Submit Technical Requirements"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("icon-send")).toBeInTheDocument();
    });
  });

  describe("Form Sections", () => {
    it("renders the Contact Information section", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Contact Information")).toBeInTheDocument();
    });

    it("renders contact fields (Full Name, Email, Phone, Company Name)", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Full Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Phone (Optional)")).toBeInTheDocument();
      expect(screen.getByText("Company Name")).toBeInTheDocument();
    });

    it("renders the Project Details section", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Project Details")).toBeInTheDocument();
    });

    it("renders project fields (Project Name, Project Type, Project Description, Target Audience)", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Project Name")).toBeInTheDocument();
      expect(screen.getByText("Project Type")).toBeInTheDocument();
      expect(screen.getByText("Project Description")).toBeInTheDocument();
      expect(screen.getByText("Target Audience")).toBeInTheDocument();
    });

    it("renders the Technical Requirements section", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Technical Requirements")).toBeInTheDocument();
    });

    it("renders technical fields (Preferred Tech Stack, Features, Integrations, Hosting Preference)", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Preferred Tech Stack")).toBeInTheDocument();
      expect(screen.getByText("Features & Functionality")).toBeInTheDocument();
      expect(screen.getByText("Third-Party Integrations")).toBeInTheDocument();
      expect(screen.getByText("Hosting Preference")).toBeInTheDocument();
    });

    it("renders the Project Logistics section", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Project Logistics")).toBeInTheDocument();
    });

    it("renders logistics fields (Timeline, Budget Range, Design Status)", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Timeline")).toBeInTheDocument();
      expect(screen.getByText("Budget Range")).toBeInTheDocument();
      expect(screen.getByText("Design Status")).toBeInTheDocument();
    });

    it("renders the Additional Notes section", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      expect(screen.getByText("Additional Notes")).toBeInTheDocument();
    });
  });

  describe("Form Values", () => {
    it("displays pre-filled form data in contact fields", () => {
      const formData = createFormData({
        contactName: "Jane Doe",
        contactEmail: "jane@example.com",
        contactPhone: "(555) 999-1234",
        companyName: "Acme Corp",
      });

      render(<TechnicalFormFields {...defaultProps} formData={formData} />);

      expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("(555) 999-1234")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    });

    it("displays pre-filled form data in project fields", () => {
      const formData = createFormData({
        projectName: "My SaaS App",
        projectDescription: "A next-gen SaaS platform",
        targetAudience: "Small businesses",
      });

      render(<TechnicalFormFields {...defaultProps} formData={formData} />);

      expect(screen.getByDisplayValue("My SaaS App")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("A next-gen SaaS platform"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Small businesses")).toBeInTheDocument();
    });
  });

  describe("Callbacks", () => {
    it("calls onBack when the back button is clicked", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      const backButton = screen.getByText("Back").closest("button")!;
      fireEvent.click(backButton);
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });

    it("calls onSubmit when the submit button is clicked", () => {
      render(<TechnicalFormFields {...defaultProps} />);
      const submitButton = screen
        .getByText("Submit Technical Requirements")
        .closest("button")!;
      fireEvent.click(submitButton);
      expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
    });

    it("calls onFieldChange when a text input changes", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: "John Smith" } });

      expect(defaultProps.onFieldChange).toHaveBeenCalledWith(
        "contactName",
        "John Smith",
      );
    });

    it("calls onFieldChange when the email input changes", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      const emailInput = screen.getByLabelText(/^Email/i);
      fireEvent.change(emailInput, { target: { value: "john@test.com" } });

      expect(defaultProps.onFieldChange).toHaveBeenCalledWith(
        "contactEmail",
        "john@test.com",
      );
    });

    it("calls onFieldChange when a textarea changes", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      const descriptionTextarea = screen.getByLabelText(/Project Description/i);
      fireEvent.change(descriptionTextarea, {
        target: { value: "Build an e-commerce site" },
      });

      expect(defaultProps.onFieldChange).toHaveBeenCalledWith(
        "projectDescription",
        "Build an e-commerce site",
      );
    });

    it("calls onFieldChange when a select changes", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      const projectTypeSelect = screen.getByLabelText(/Project Type/i);
      fireEvent.change(projectTypeSelect, { target: { value: "webapp" } });

      expect(defaultProps.onFieldChange).toHaveBeenCalledWith(
        "projectType",
        "webapp",
      );
    });
  });

  describe("Submit Button State", () => {
    it('shows "Submit Technical Requirements" when not submitting', () => {
      render(<TechnicalFormFields {...defaultProps} isSubmitting={false} />);
      expect(
        screen.getByText("Submit Technical Requirements"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Submitting...")).not.toBeInTheDocument();
    });

    it('shows "Submitting..." when isSubmitting is true', () => {
      render(<TechnicalFormFields {...defaultProps} isSubmitting={true} />);
      expect(screen.getByText("Submitting...")).toBeInTheDocument();
      expect(
        screen.queryByText("Submit Technical Requirements"),
      ).not.toBeInTheDocument();
    });

    it("disables the submit button when isSubmitting is true", () => {
      render(<TechnicalFormFields {...defaultProps} isSubmitting={true} />);
      const submitButton = screen.getByText("Submitting...").closest("button")!;
      expect(submitButton).toBeDisabled();
    });

    it("enables the submit button when isSubmitting is false", () => {
      render(<TechnicalFormFields {...defaultProps} isSubmitting={false} />);
      const submitButton = screen
        .getByText("Submit Technical Requirements")
        .closest("button")!;
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Error Display", () => {
    it("displays field-level error messages when errors are provided", () => {
      const errors = {
        contactName: "Name is required",
        contactEmail: "Valid email is required",
      };

      render(<TechnicalFormFields {...defaultProps} errors={errors} />);

      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Valid email is required")).toBeInTheDocument();
    });

    it("displays the FormErrors summary when errors exist", () => {
      const errors = {
        contactName: "Name is required",
        budget: "Budget is required",
      };

      render(<TechnicalFormFields {...defaultProps} errors={errors} />);

      expect(
        screen.getByText("Please correct the following errors:"),
      ).toBeInTheDocument();
    });

    it("does not display FormErrors summary when there are no errors", () => {
      render(<TechnicalFormFields {...defaultProps} errors={{}} />);
      expect(
        screen.queryByText("Please correct the following errors:"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Select Options", () => {
    it("renders project type options", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      const projectTypeSelect = screen.getByLabelText(/Project Type/i);
      expect(projectTypeSelect).toBeInTheDocument();

      // Check a few options exist
      expect(screen.getByText("Website")).toBeInTheDocument();
      expect(screen.getByText("Web Application")).toBeInTheDocument();
      expect(screen.getByText("Mobile Application")).toBeInTheDocument();
      expect(screen.getByText("E-Commerce Platform")).toBeInTheDocument();
      expect(screen.getByText("API/Backend Service")).toBeInTheDocument();
    });

    it("renders timeline options", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      expect(screen.getByText("ASAP (Rush)")).toBeInTheDocument();
      expect(screen.getByText("1 Month")).toBeInTheDocument();
      expect(screen.getByText("2-3 Months")).toBeInTheDocument();
      expect(screen.getByText("3-6 Months")).toBeInTheDocument();
      expect(screen.getByText("Flexible")).toBeInTheDocument();
    });

    it("renders budget options", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      expect(screen.getByText("Under $5,000")).toBeInTheDocument();
      expect(screen.getByText("$5,000 - $10,000")).toBeInTheDocument();
      expect(screen.getByText("$10,000 - $25,000")).toBeInTheDocument();
      expect(screen.getByText("$25,000 - $50,000")).toBeInTheDocument();
      expect(screen.getByText("$50,000+")).toBeInTheDocument();
    });

    it("renders hosting preference options", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      expect(
        screen.getByText("Cloud (AWS, Google Cloud, Azure)"),
      ).toBeInTheDocument();
      expect(screen.getByText("Vercel/Netlify")).toBeInTheDocument();
      expect(screen.getByText("Dedicated Server")).toBeInTheDocument();
      expect(screen.getByText("Client Manages")).toBeInTheDocument();
      expect(screen.getByText("Need Recommendation")).toBeInTheDocument();
    });

    it("renders design status options", () => {
      render(<TechnicalFormFields {...defaultProps} />);

      expect(screen.getByText("Design Completed")).toBeInTheDocument();
      expect(screen.getByText("Design In Progress")).toBeInTheDocument();
      expect(screen.getByText("Need Design Services")).toBeInTheDocument();
      expect(screen.getByText("No Design Needed")).toBeInTheDocument();
    });
  });
});
