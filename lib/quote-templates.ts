// lib/quote-templates.ts - Document templates for quote forms

import type { GuidedFormData, TechnicalFormData } from './quote-types'

export function generateTechnicalDocument(): string {
  return `# Technical Requirements Document
## Sunny Stack Development

**Contact:** Luka Fagundes
**Email:** luka@sunny-stack.com
**Website:** sunny-stack.com

---

## 1. Contact Information

**Full Name:**
_[Your name]_

**Email:**
_[Your email]_

**Company Name:**
_[Your company]_

**Phone Number (Optional):**
_[Your phone]_

---

## 2. Project Overview

**Project Name:**
_[Project name]_

**Project Type:**
- [ ] Website (Marketing site, portfolio, blog)
- [ ] Web Application (Interactive app, SaaS, dashboard)
- [ ] Desktop Application (Windows, Mac, Linux)
- [ ] Mobile Application (iOS, Android, cross-platform)
- [ ] E-Commerce Platform (Online store, marketplace)
- [ ] API/Backend Service
- [ ] Other: _[Specify]_

**Project Description:**
_[Provide a detailed description of your project, its purpose, and main objectives]_

**Target Audience:**
_[Who will be using this application?]_

**Primary Goals:**
1. _[Goal 1]_
2. _[Goal 2]_
3. _[Goal 3]_

---

## 3. Technical Requirements

**Preferred Technology Stack:**
_[e.g., React, Node.js, PostgreSQL - or leave blank for recommendations]_

**Required Features & Functionality:**
- [ ] User authentication/authorization
- [ ] Payment processing
- [ ] Email notifications
- [ ] File uploads/downloads
- [ ] Search functionality
- [ ] Admin dashboard
- [ ] Analytics/reporting
- [ ] Real-time updates
- [ ] Mobile responsive design
- [ ] Other: _[List additional features]_

**Third-Party Integrations:**
_[List any APIs, services, or platforms to integrate with]_

**Performance Requirements:**
_[e.g., page load times, concurrent users, data processing needs]_

**Security Requirements:**
_[e.g., data encryption, compliance standards, authentication methods]_

---

## 4. Design & User Experience

**Design Status:**
- [ ] Design completed (will provide files)
- [ ] Design in progress
- [ ] Need design services
- [ ] No design needed

**Brand Guidelines:**
_[Colors, fonts, logos, style preferences]_

**Reference Sites/Apps:**
_[URLs of sites/apps you like]_

---

## 5. Infrastructure & Deployment

**Hosting Preference:**
- [ ] Cloud hosting (AWS, Google Cloud, Azure)
- [ ] Dedicated server
- [ ] Shared hosting
- [ ] Let Sunny Stack recommend

**Domain Status:**
- [ ] Already have domain
- [ ] Need to purchase domain
- [ ] Using subdomain

**Maintenance & Support:**
- [ ] Ongoing maintenance required
- [ ] Training needed
- [ ] Documentation needed

---

## 6. Project Logistics

**Timeline:**
_[When do you need this completed?]_

**Budget Range:**
_[Your budget for this project]_

**Key Milestones:**
1. _[Milestone 1]_
2. _[Milestone 2]_
3. _[Milestone 3]_

**Success Metrics:**
_[How will you measure project success?]_

---

## 7. Additional Information

**Current Solutions/Systems:**
_[What are you currently using?]_

**Pain Points:**
_[What problems are you trying to solve?]_

**Competitors/Inspiration:**
_[Who are your competitors or inspiration?]_

**Special Requirements:**
_[Any other specific requirements or considerations?]_

---

## Next Steps

1. Review and complete this document
2. Send to luka@sunny-stack.com
3. Schedule a consultation call
4. Receive project proposal
5. Begin development

---

*Thank you for choosing Sunny Stack for your development needs!*`
}

export function formatGuidedEmailHtml(data: GuidedFormData): string {
  return `
    <h2>New Project Request (Guided Form)</h2>

    <h3>Contact Information</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Company:</strong> ${data.company || 'Not provided'}</p>

    <h3>Project Details</h3>
    <p><strong>Project Type:</strong> ${data.projectType}</p>
    <p><strong>Description:</strong></p>
    <p>${data.projectDescription}</p>

    <h3>Features Requested</h3>
    <ul>
      ${data.features.map((feature) => `<li>${feature}</li>`).join('')}
    </ul>

    <h3>Project Logistics</h3>
    <p><strong>Timeline:</strong> ${data.timeline}</p>
    <p><strong>Budget:</strong> ${data.budget}</p>

    <hr>
    <p><em>This request was submitted via the guided form on sunny-stack.com</em></p>
  `
}

export function formatTechnicalEmailHtml(data: TechnicalFormData): string {
  return `
    <h2>Technical Requirements Submission</h2>

    <h3>Contact Information</h3>
    <p><strong>Name:</strong> ${data.contactName}</p>
    <p><strong>Email:</strong> ${data.contactEmail}</p>
    <p><strong>Company:</strong> ${data.companyName || 'Not provided'}</p>

    <h3>Project Overview</h3>
    <p><strong>Project Name:</strong> ${data.projectName}</p>
    <p><strong>Project Type:</strong> ${data.projectType}</p>
    <p><strong>Description:</strong></p>
    <p>${data.projectDescription}</p>
    <p><strong>Target Audience:</strong> ${data.targetAudience || 'Not specified'}</p>

    <h3>Technical Requirements</h3>
    <p><strong>Tech Stack:</strong> ${data.techStack || 'No preference'}</p>
    <p><strong>Features & Functionality:</strong></p>
    <p>${data.features}</p>
    <p><strong>Integrations:</strong></p>
    <p>${data.integrations || 'None specified'}</p>
    <p><strong>Hosting Preference:</strong> ${data.hostingPreference || 'Not specified'}</p>

    <h3>Project Logistics</h3>
    <p><strong>Timeline:</strong> ${data.timeline}</p>
    <p><strong>Budget Range:</strong> ${data.budget}</p>
    <p><strong>Design Status:</strong> ${data.designStatus || 'Not specified'}</p>

    <h3>Additional Notes</h3>
    <p>${data.additionalNotes || 'None'}</p>

    <hr>
    <p><em>This request was submitted via the technical form on sunny-stack.com</em></p>
  `
}

export function getTimelineLabel(timeline: string): string {
  const labels: Record<string, string> = {
    'asap': 'ASAP',
    '1month': 'Within 1 month',
    '3months': 'Within 3 months',
    'flexible': 'Flexible timeline'
  }
  return labels[timeline] || timeline
}

export function getBudgetLabel(budget: string): string {
  const labels: Record<string, string> = {
    'under5k': 'Under $5,000',
    '5k-10k': '$5,000 - $10,000',
    '10k-25k': '$10,000 - $25,000',
    '25k+': '$25,000+'
  }
  return labels[budget] || budget
}

export function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'website': 'Website',
    'webapp': 'Web Application',
    'desktop': 'Desktop Application',
    'mobile': 'Mobile Application',
    'ecommerce': 'E-Commerce Platform',
    'other': 'Other'
  }
  return labels[type] || type
}

export function downloadMarkdownFile(content: string, filename: string): void {
  if (typeof window === 'undefined') return

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Function to download technical requirements template
export function downloadTechnicalTemplate() {
  const markdownContent = `# Technical Requirements Document
## Sunny Stack Development

**Contact:** Luka Fagundes
**Email:** luka@sunny-stack.com
**Website:** sunny-stack.com

---

## 1. Contact Information

**Full Name:**
_[Your name]_

**Email:**
_[Your email]_

**Company Name:**
_[Your company]_

---

## 2. Project Overview

**Project Name:**
_[Project name]_

**Project Type:**
- [ ] Website (Marketing site, portfolio, blog)
- [ ] Web Application (Interactive app, SaaS, dashboard)
- [ ] Desktop Application (Windows, Mac, Linux)
- [ ] Mobile Application (iOS, Android, cross-platform)
- [ ] E-Commerce Platform (Online store, marketplace)
- [ ] API/Backend Service
- [ ] Other: _[Specify]_

**Project Description:**
_[Provide a detailed description of your project, its purpose, and main objectives]_

---

## 3. Technical Requirements

**Preferred Technology Stack:**
_[e.g., React, Node.js, PostgreSQL - or leave blank for recommendations]_

**Required Features & Functionality:**
- [ ] User authentication/authorization
- [ ] Payment processing
- [ ] Email notifications
- [ ] File uploads/downloads
- [ ] Search functionality
- [ ] Admin dashboard
- [ ] Analytics/reporting
- [ ] Real-time updates
- [ ] Mobile responsive design
- [ ] Other: _[List additional features]_

---

## 4. Project Logistics

**Timeline:**
- [ ] ASAP (Rush delivery)
- [ ] 1 month
- [ ] 2-3 months
- [ ] 3-6 months
- [ ] Flexible

**Budget Range:**
- [ ] Under $5,000
- [ ] $5,000 - $10,000
- [ ] $10,000 - $25,000
- [ ] $25,000 - $50,000
- [ ] $50,000+

---

## Submission Instructions

Please save this completed document and email it to:
**luka@sunny-stack.com**

Subject Line: **Technical Requirements - [Your Project Name]**

---

*Thank you for choosing Sunny Stack for your development needs!*
`

  downloadMarkdownFile(markdownContent, 'sunny-stack-technical-requirements.md')
}
