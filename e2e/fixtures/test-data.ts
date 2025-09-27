export const validGuidedFormData = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '555-123-4567',
  company: 'Test Company Inc',
  projectType: 'website',
  projectDescription: 'I need a modern website for my business that showcases our services and allows customers to contact us.',
  features: ['User accounts/login', 'Payment processing', 'Email notifications', 'Mobile responsive'],
  timeline: '1month',
  budget: '5k-10k',
  hasDesign: 'yes',
  needsBackend: 'yes',
  needsAuth: 'yes',
  integrations: 'Stripe for payments, SendGrid for emails',
  specialRequirements: 'Must be WCAG compliant for accessibility'
}

export const validTechnicalFormData = {
  contactName: 'Technical Lead',
  contactEmail: 'tech@example.com',
  companyName: 'Tech Solutions LLC',
  projectName: 'Enterprise Dashboard',
  projectType: 'webapp',
  projectDescription: 'A comprehensive dashboard for monitoring system metrics and managing resources',
  targetAudience: 'System administrators and DevOps teams',
  techStack: 'React, Node.js, PostgreSQL, Redis',
  features: 'Real-time monitoring, Alert system, User management, Report generation, API access',
  integrations: 'AWS CloudWatch, Datadog, Slack notifications',
  hostingPreference: 'cloud',
  timeline: '3-6months',
  budget: '25k-50k',
  designStatus: 'in-progress',
  additionalNotes: 'Security is a top priority. Need SOC2 compliance.'
}

export const invalidFormData = {
  email: 'invalid-email-format',
  phone: '123',
  name: '',
  projectDescription: 'a'.repeat(1001), // Exceeds max length
  budget: '',
  timeline: ''
}

export const edgeCaseData = {
  specialCharacters: {
    name: "O'Brien-Smith & Co.",
    company: '<script>alert("XSS")</script>',
    projectDescription: '```javascript\nconsole.log("code injection test")\n```'
  },
  maxLengthInputs: {
    name: 'A'.repeat(50),
    email: 'a'.repeat(40) + '@example.com',
    projectDescription: 'B'.repeat(1000),
    specialRequirements: 'C'.repeat(1000)
  },
  minimalData: {
    name: 'A',
    email: 'a@b.c',
    company: '',
    projectType: 'other',
    projectDescription: 'Test',
    timeline: 'flexible',
    budget: 'under5k'
  }
}

export const mobileTestData = {
  touchTargets: {
    minSize: 44, // Minimum touch target size in pixels
    spacing: 8   // Minimum spacing between targets
  },
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  }
}

export const performanceThresholds = {
  pageLoadTime: 3000,     // 3 seconds
  interactionDelay: 100,  // 100ms
  animationFPS: 60,       // 60 frames per second
  memoryLimit: 50 * 1024 * 1024, // 50MB
  apiResponseTime: 1000   // 1 second
}
