import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with your API key
// You'll need to sign up at https://resend.com and get an API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limiting configuration
const RATE_LIMIT_MINUTE = 10  // 10 requests per minute
const RATE_LIMIT_HOUR = 100   // 100 requests per hour
const MINUTE_MS = 60 * 1000   // 1 minute in milliseconds
const HOUR_MS = 60 * 60 * 1000 // 1 hour in milliseconds

// In-memory storage for rate limiting
interface RequestLog {
  timestamp: number
  count: number
}

// Store request logs per IP address
const requestLogs = new Map<string, RequestLog[]>()

// Clean up old entries periodically to prevent memory leaks
function cleanupOldEntries() {
  const now = Date.now()
  const hourAgo = now - HOUR_MS

  for (const [ip, logs] of requestLogs.entries()) {
    // Remove logs older than 1 hour
    const recentLogs = logs.filter(log => log.timestamp > hourAgo)

    if (recentLogs.length === 0) {
      // Remove IP entirely if no recent requests
      requestLogs.delete(ip)
    } else {
      // Update with filtered logs
      requestLogs.set(ip, recentLogs)
    }
  }
}

// Get client IP address from request headers
function getClientIP(request: Request): string {
  // Check Vercel forwarded headers first
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return xForwardedFor.split(',')[0].trim()
  }

  // Check other common headers
  const xRealIP = request.headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP.trim()
  }

  // Fallback to connection remote address (may not work in serverless)
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  // Default fallback
  return 'unknown'
}

// Check if IP is rate limited
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const minuteAgo = now - MINUTE_MS
  const hourAgo = now - HOUR_MS

  // Get existing logs for this IP
  const logs = requestLogs.get(ip) || []

  // Count requests in the last minute
  const requestsInMinute = logs.filter(log => log.timestamp > minuteAgo).length

  // Count requests in the last hour
  const requestsInHour = logs.filter(log => log.timestamp > hourAgo).length

  // Check if either limit is exceeded
  return requestsInMinute >= RATE_LIMIT_MINUTE || requestsInHour >= RATE_LIMIT_HOUR
}

// Log a request for an IP address
function logRequest(ip: string): void {
  const now = Date.now()
  const logs = requestLogs.get(ip) || []

  // Add new request log
  logs.push({ timestamp: now, count: 1 })

  // Store updated logs
  requestLogs.set(ip, logs)

  // Clean up old entries every 100 requests to prevent memory leaks
  if (Math.random() < 0.01) { // 1% chance per request
    cleanupOldEntries()
  }
}

// Validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function sanitizeHtml(input: string): string {
  // Strip all HTML tags from input
  return input.replace(/<[^>]*>/g, '').trim()
}

function validateLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or less`
  }
  return null
}

function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`
  }
  return null
}

// Validation interfaces
interface ValidationError {
  field: string
  message: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Guided form validation
function validateGuidedForm(data: GuidedFormData): ValidationResult {
  const errors: ValidationError[] = []

  // Sanitize all text inputs
  const sanitizedData = {
    ...data,
    name: sanitizeHtml(data.name),
    email: sanitizeHtml(data.email),
    company: data.company ? sanitizeHtml(data.company) : '',
    projectType: sanitizeHtml(data.projectType),
    projectDescription: sanitizeHtml(data.projectDescription),
    timeline: sanitizeHtml(data.timeline),
    budget: sanitizeHtml(data.budget),
    features: data.features.map(feature => sanitizeHtml(feature))
  }

  // Required field validations
  const nameError = validateRequired(sanitizedData.name, 'Name')
  if (nameError) errors.push({ field: 'name', message: nameError })

  const emailError = validateRequired(sanitizedData.email, 'Email')
  if (emailError) errors.push({ field: 'email', message: emailError })

  const projectTypeError = validateRequired(sanitizedData.projectType, 'Project Type')
  if (projectTypeError) errors.push({ field: 'projectType', message: projectTypeError })

  const timelineError = validateRequired(sanitizedData.timeline, 'Timeline')
  if (timelineError) errors.push({ field: 'timeline', message: timelineError })

  const budgetError = validateRequired(sanitizedData.budget, 'Budget')
  if (budgetError) errors.push({ field: 'budget', message: budgetError })

  // Email format validation
  if (sanitizedData.email && !isValidEmail(sanitizedData.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  // Length validations
  const nameLengthError = validateLength(sanitizedData.name, 50, 'Name')
  if (nameLengthError) errors.push({ field: 'name', message: nameLengthError })

  if (sanitizedData.company) {
    const companyLengthError = validateLength(sanitizedData.company, 50, 'Company')
    if (companyLengthError) errors.push({ field: 'company', message: companyLengthError })
  }

  const descriptionLengthError = validateLength(sanitizedData.projectDescription, 1000, 'Project Description')
  if (descriptionLengthError) errors.push({ field: 'projectDescription', message: descriptionLengthError })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Technical form validation
function validateTechnicalForm(data: TechnicalFormData): ValidationResult {
  const errors: ValidationError[] = []

  // Sanitize all text inputs
  const sanitizedData = {
    ...data,
    contactName: sanitizeHtml(data.contactName),
    contactEmail: sanitizeHtml(data.contactEmail),
    companyName: data.companyName ? sanitizeHtml(data.companyName) : '',
    projectName: sanitizeHtml(data.projectName),
    projectType: sanitizeHtml(data.projectType),
    projectDescription: sanitizeHtml(data.projectDescription),
    targetAudience: data.targetAudience ? sanitizeHtml(data.targetAudience) : '',
    techStack: data.techStack ? sanitizeHtml(data.techStack) : '',
    features: sanitizeHtml(data.features),
    integrations: data.integrations ? sanitizeHtml(data.integrations) : '',
    hostingPreference: data.hostingPreference ? sanitizeHtml(data.hostingPreference) : '',
    timeline: sanitizeHtml(data.timeline),
    budget: sanitizeHtml(data.budget),
    designStatus: data.designStatus ? sanitizeHtml(data.designStatus) : '',
    additionalNotes: data.additionalNotes ? sanitizeHtml(data.additionalNotes) : ''
  }

  // Required field validations
  const contactNameError = validateRequired(sanitizedData.contactName, 'Contact Name')
  if (contactNameError) errors.push({ field: 'contactName', message: contactNameError })

  const contactEmailError = validateRequired(sanitizedData.contactEmail, 'Contact Email')
  if (contactEmailError) errors.push({ field: 'contactEmail', message: contactEmailError })

  const projectNameError = validateRequired(sanitizedData.projectName, 'Project Name')
  if (projectNameError) errors.push({ field: 'projectName', message: projectNameError })

  const projectTypeError = validateRequired(sanitizedData.projectType, 'Project Type')
  if (projectTypeError) errors.push({ field: 'projectType', message: projectTypeError })

  const projectDescriptionError = validateRequired(sanitizedData.projectDescription, 'Project Description')
  if (projectDescriptionError) errors.push({ field: 'projectDescription', message: projectDescriptionError })

  const featuresError = validateRequired(sanitizedData.features, 'Features & Functionality')
  if (featuresError) errors.push({ field: 'features', message: featuresError })

  const timelineError = validateRequired(sanitizedData.timeline, 'Timeline')
  if (timelineError) errors.push({ field: 'timeline', message: timelineError })

  const budgetError = validateRequired(sanitizedData.budget, 'Budget Range')
  if (budgetError) errors.push({ field: 'budget', message: budgetError })

  // Email format validation
  if (sanitizedData.contactEmail && !isValidEmail(sanitizedData.contactEmail)) {
    errors.push({ field: 'contactEmail', message: 'Please enter a valid email address' })
  }

  // Length validations
  const contactNameLengthError = validateLength(sanitizedData.contactName, 50, 'Contact Name')
  if (contactNameLengthError) errors.push({ field: 'contactName', message: contactNameLengthError })

  if (sanitizedData.companyName) {
    const companyNameLengthError = validateLength(sanitizedData.companyName, 50, 'Company Name')
    if (companyNameLengthError) errors.push({ field: 'companyName', message: companyNameLengthError })
  }

  const projectNameLengthError = validateLength(sanitizedData.projectName, 50, 'Project Name')
  if (projectNameLengthError) errors.push({ field: 'projectName', message: projectNameLengthError })

  const projectDescriptionLengthError = validateLength(sanitizedData.projectDescription, 1000, 'Project Description')
  if (projectDescriptionLengthError) errors.push({ field: 'projectDescription', message: projectDescriptionLengthError })

  const featuresLengthError = validateLength(sanitizedData.features, 1000, 'Features & Functionality')
  if (featuresLengthError) errors.push({ field: 'features', message: featuresLengthError })

  if (sanitizedData.targetAudience) {
    const targetAudienceLengthError = validateLength(sanitizedData.targetAudience, 1000, 'Target Audience')
    if (targetAudienceLengthError) errors.push({ field: 'targetAudience', message: targetAudienceLengthError })
  }

  if (sanitizedData.integrations) {
    const integrationsLengthError = validateLength(sanitizedData.integrations, 1000, 'Integrations')
    if (integrationsLengthError) errors.push({ field: 'integrations', message: integrationsLengthError })
  }

  if (sanitizedData.additionalNotes) {
    const additionalNotesLengthError = validateLength(sanitizedData.additionalNotes, 1000, 'Additional Notes')
    if (additionalNotesLengthError) errors.push({ field: 'additionalNotes', message: additionalNotesLengthError })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}


interface GuidedFormData {
  formType: 'guided'
  name: string
  email: string
  company?: string
  projectType: string
  projectDescription: string
  features: string[]
  timeline: string
  budget: string
}

interface TechnicalFormData {
  formType: 'technical'
  contactName: string
  contactEmail: string
  companyName?: string
  projectName: string
  projectType: string
  projectDescription: string
  targetAudience?: string
  techStack?: string
  features: string
  integrations?: string
  hostingPreference?: string
  timeline: string
  budget: string
  designStatus?: string
  additionalNotes?: string
}

type FormData = GuidedFormData | TechnicalFormData

export async function POST(request: Request) {
  try {
    // Get client IP address
    const clientIP = getClientIP(request)

    // Check rate limiting before processing the request
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please email directly at luka@sunny-stack.com'
        },
        { status: 429 }
      )
    }

    // Log this request
    logRequest(clientIP)

    const body: FormData = await request.json()

    // Validate the form data based on form type
    let validationResult: ValidationResult

    if (body.formType === 'guided') {
      validationResult = validateGuidedForm(body as GuidedFormData)
    } else if (body.formType === 'technical') {
      validationResult = validateTechnicalForm(body as TechnicalFormData)
    } else {
      return NextResponse.json(
        {
          error: 'Invalid form type',
          details: 'Form type must be either "guided" or "technical"'
        },
        { status: 400 }
      )
    }

    // Return validation errors if any
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: 'Please check the following fields and try again:',
          validationErrors: validationResult.errors
        },
        { status: 400 }
      )
    }

    // Create sanitized data object for email generation
    let sanitizedData: GuidedFormData | TechnicalFormData
    let replyToEmail: string

    if (body.formType === 'guided') {
      const guidedData = body as GuidedFormData
      sanitizedData = {
        formType: 'guided',
        name: sanitizeHtml(guidedData.name),
        email: sanitizeHtml(guidedData.email),
        company: guidedData.company ? sanitizeHtml(guidedData.company) : undefined,
        projectType: sanitizeHtml(guidedData.projectType),
        projectDescription: sanitizeHtml(guidedData.projectDescription),
        timeline: sanitizeHtml(guidedData.timeline),
        budget: sanitizeHtml(guidedData.budget),
        features: guidedData.features.map(feature => sanitizeHtml(feature))
      } as GuidedFormData
      replyToEmail = sanitizedData.email
    } else {
      const technicalData = body as TechnicalFormData
      sanitizedData = {
        formType: 'technical',
        contactName: sanitizeHtml(technicalData.contactName),
        contactEmail: sanitizeHtml(technicalData.contactEmail),
        companyName: technicalData.companyName ? sanitizeHtml(technicalData.companyName) : undefined,
        projectName: sanitizeHtml(technicalData.projectName),
        projectType: sanitizeHtml(technicalData.projectType),
        projectDescription: sanitizeHtml(technicalData.projectDescription),
        targetAudience: technicalData.targetAudience ? sanitizeHtml(technicalData.targetAudience) : undefined,
        techStack: technicalData.techStack ? sanitizeHtml(technicalData.techStack) : undefined,
        features: sanitizeHtml(technicalData.features),
        integrations: technicalData.integrations ? sanitizeHtml(technicalData.integrations) : undefined,
        hostingPreference: technicalData.hostingPreference ? sanitizeHtml(technicalData.hostingPreference) : undefined,
        timeline: sanitizeHtml(technicalData.timeline),
        budget: sanitizeHtml(technicalData.budget),
        designStatus: technicalData.designStatus ? sanitizeHtml(technicalData.designStatus) : undefined,
        additionalNotes: technicalData.additionalNotes ? sanitizeHtml(technicalData.additionalNotes) : undefined
      } as TechnicalFormData
      replyToEmail = sanitizedData.contactEmail
    }

    // Format the email content based on form type using sanitized data
    let emailHtml = ''
    let subject = ''

    if (sanitizedData.formType === 'guided') {
      // Guided form submission
      const guidedData = sanitizedData as GuidedFormData
      subject = `New Project Request from ${guidedData.name}`
      emailHtml = `
        <h2>New Project Request (Guided Form)</h2>

        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${guidedData.name}</p>
        <p><strong>Email:</strong> ${guidedData.email}</p>
        <p><strong>Company:</strong> ${guidedData.company || 'Not provided'}</p>

        <h3>Project Details</h3>
        <p><strong>Project Type:</strong> ${guidedData.projectType}</p>
        <p><strong>Description:</strong></p>
        <p>${guidedData.projectDescription}</p>

        <h3>Features Requested</h3>
        <ul>
          ${guidedData.features.map((feature: string) => `<li>${feature}</li>`).join('')}
        </ul>

        <h3>Project Logistics</h3>
        <p><strong>Timeline:</strong> ${guidedData.timeline}</p>
        <p><strong>Budget:</strong> ${guidedData.budget}</p>

        <hr>
        <p><em>This request was submitted via the guided form on sunny-stack.com</em></p>
      `
    } else if (sanitizedData.formType === 'technical') {
      // Technical form submission
      const technicalData = sanitizedData as TechnicalFormData
      subject = `Technical Requirements from ${technicalData.contactName}`
      emailHtml = `
        <h2>Technical Requirements Submission</h2>

        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${technicalData.contactName}</p>
        <p><strong>Email:</strong> ${technicalData.contactEmail}</p>
        <p><strong>Company:</strong> ${technicalData.companyName || 'Not provided'}</p>

        <h3>Project Overview</h3>
        <p><strong>Project Name:</strong> ${technicalData.projectName}</p>
        <p><strong>Project Type:</strong> ${technicalData.projectType}</p>
        <p><strong>Description:</strong></p>
        <p>${technicalData.projectDescription}</p>
        <p><strong>Target Audience:</strong> ${technicalData.targetAudience || 'Not specified'}</p>

        <h3>Technical Requirements</h3>
        <p><strong>Tech Stack:</strong> ${technicalData.techStack || 'No preference'}</p>
        <p><strong>Features & Functionality:</strong></p>
        <p>${technicalData.features}</p>
        <p><strong>Integrations:</strong></p>
        <p>${technicalData.integrations || 'None specified'}</p>
        <p><strong>Hosting Preference:</strong> ${technicalData.hostingPreference || 'Not specified'}</p>

        <h3>Project Logistics</h3>
        <p><strong>Timeline:</strong> ${technicalData.timeline}</p>
        <p><strong>Budget Range:</strong> ${technicalData.budget}</p>
        <p><strong>Design Status:</strong> ${technicalData.designStatus || 'Not specified'}</p>

        <h3>Additional Notes</h3>
        <p>${technicalData.additionalNotes || 'None'}</p>

        <hr>
        <p><em>This request was submitted via the technical form on sunny-stack.com</em></p>
      `
    }

    // Send the email using Resend
    const response = await resend.emails.send({
      from: 'Sunny Stack Forms <forms@sunny-stack.com>', // Using your verified domain
      to: ['luka@sunny-stack.com'],
      subject: subject,
      html: emailHtml,
      replyTo: replyToEmail,
    })

    // Check if the response has data property (successful send)
    if (response.data) {
      return NextResponse.json({ success: true, id: response.data.id })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}