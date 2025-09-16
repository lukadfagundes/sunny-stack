'use client'

import { useState } from 'react'
import { ChevronRight, Download, Send, Code2, Users, Sparkles, ArrowLeft, ArrowRight, FileText, Zap } from 'lucide-react'

type FormMode = 'selection' | 'guided' | 'technical'
type ProjectType = 'website' | 'webapp' | 'desktop' | 'mobile' | 'ecommerce' | 'other'
type Timeline = 'asap' | '1month' | '3months' | 'flexible'
type Budget = 'under5k' | '5k-10k' | '10k-25k' | '25k+'

export default function Quote() {
  const [mode, setMode] = useState<FormMode>('selection')
  const [currentStep, setCurrentStep] = useState(0)
  const [technicalView, setTechnicalView] = useState<'choice' | 'form' | 'download'>('choice')
  
  // Technical form state
  const [technicalForm, setTechnicalForm] = useState({
    contactName: '',
    contactEmail: '',
    companyName: '',
    projectName: '',
    projectType: '',
    projectDescription: '',
    targetAudience: '',
    primaryGoals: '',
    techStack: '',
    hostingPreference: '',
    budget: '',
    timeline: '',
    features: '',
    integrations: '',
    designStatus: '',
    additionalNotes: ''
  })
  
  // Guided form data
  const [formData, setFormData] = useState({
    // Contact info
    name: '',
    email: '',
    company: '',
    
    // Project basics
    projectType: '' as ProjectType | '',
    projectDescription: '',
    
    // Features (guided mode)
    features: [] as string[],
    timeline: '' as Timeline | '',
    budget: '' as Budget | '',
    
    // Technical details
    hasDesign: '',
    needsBackend: '',
    needsAuth: '',
    integrations: '',
    specialRequirements: ''
  })

  const guidedSteps = [
    'contact',
    'projectType', 
    'description',
    'features',
    'timeline',
    'budget',
    'review'
  ]

  const handleNext = () => {
    if (currentStep < guidedSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      setMode('selection')
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          formType: 'guided'
        }),
      })
      
      if (response.ok) {
        alert('Thank you! Your project request has been sent. I\'ll get back to you within 24 hours.')
        // Reset form or redirect
        setMode('selection')
        setCurrentStep(0)
        setFormData({
          name: '',
          email: '',
          company: '',
          projectType: '',
          projectDescription: '',
          features: [],
          timeline: '',
          budget: '',
          hasDesign: '',
          needsBackend: '',
          needsAuth: '',
          integrations: '',
          specialRequirements: ''
        })
      } else {
        throw new Error('Failed to send')
      }
    } catch (error) {
      alert('There was an error sending your request. Please email luka@sunny-stack.com directly.')
    }
  }

  const downloadTechnicalDoc = () => {
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
- [ ] Cloud (AWS, Google Cloud, Azure)
- [ ] Vercel/Netlify
- [ ] Dedicated server
- [ ] Client will manage
- [ ] Need recommendation

**Domain Status:**
- [ ] Already own domain
- [ ] Need to purchase domain
- [ ] Not applicable

**Environment Requirements:**
- [ ] Development
- [ ] Staging
- [ ] Production
- [ ] Other: _[Specify]_

---

## 6. Project Logistics

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

**Maintenance & Support:**
- [ ] One-time development only
- [ ] Ongoing maintenance needed
- [ ] Training required
- [ ] Documentation required

---

## 7. Additional Information

**Current System/Workflow:**  
_[Describe any existing systems this will replace or integrate with]_

**Success Metrics:**  
_[How will you measure if this project is successful?]_

**Constraints or Special Requirements:**  
_[Any specific constraints, regulations, or special requirements]_

**Additional Notes:**  
_[Any other information that would be helpful]_

---

## Submission Instructions

Please save this completed document and email it to:  
**luka@sunny-stack.com**

Subject Line: **Technical Requirements - [Your Project Name]**

I'll review your requirements and get back to you within 24 hours with:
- Project feasibility assessment
- Recommended approach
- Timeline estimate
- Cost estimate

---

*Thank you for choosing Sunny Stack for your development needs!*
`

    // Create blob and download
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sunny-stack-technical-requirements.md'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Selection Screen
  if (mode === 'selection') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto pt-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-sunny-gradient bg-clip-text text-transparent">
                  Let's Build Something Amazing
                </span>
              </h1>
              <p className="text-lg text-sunny-brown/80">
                Choose how you'd like to describe your project
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Guided Option */}
              <button
                onClick={() => setMode('guided')}
                className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8 text-left hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-gold/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-sunny-red" />
                  <h2 className="text-xl font-bold text-sunny-darkRed">I'll Walk You Through It</h2>
                </div>
                <p className="text-sunny-brown/80 mb-4">
                  Perfect if you're not sure about all the technical details. I'll ask simple questions 
                  to understand your vision.
                </p>
                <div className="flex items-center gap-2 text-sunny-red">
                  <span className="text-sm font-medium">Start Guided Process</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* Technical Option */}
              <button
                onClick={() => setMode('technical')}
                className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8 text-left hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-ocean/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Code2 className="w-8 h-8 text-sunny-ocean" />
                  <h2 className="text-xl font-bold text-sunny-darkRed">I Know What I Need</h2>
                </div>
                <p className="text-sunny-brown/80 mb-4">
                  For those who speak tech. Download a technical requirements document to fill out 
                  with all the specifics.
                </p>
                <div className="flex items-center gap-2 text-sunny-ocean">
                  <span className="text-sm font-medium">Get Technical Doc</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const handleTechnicalSubmit = async () => {
    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...technicalForm,
          formType: 'technical'
        }),
      })
      
      if (response.ok) {
        alert('Thank you! Your technical requirements have been sent. I\'ll review them and get back to you within 24 hours with a detailed quote.')
        // Reset form
        setTechnicalView('choice')
        setTechnicalForm({
          contactName: '',
          contactEmail: '',
          companyName: '',
          projectName: '',
          projectType: '',
          projectDescription: '',
          targetAudience: '',
          primaryGoals: '',
          techStack: '',
          hostingPreference: '',
          budget: '',
          timeline: '',
          features: '',
          integrations: '',
          designStatus: '',
          additionalNotes: ''
        })
      } else {
        throw new Error('Failed to send')
      }
    } catch (error) {
      alert('There was an error sending your requirements. Please email luka@sunny-stack.com directly.')
    }
  }

  // Technical Mode
  if (mode === 'technical') {
    if (technicalView === 'form') {
      return (
        <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto pt-8">
              <button
                onClick={() => setTechnicalView('choice')}
                className="flex items-center gap-2 text-sunny-brown hover:text-sunny-red transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">Technical Requirements Form</h2>
                
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="border-b border-sunny-gold/20 pb-6">
                    <h3 className="font-bold text-sunny-red mb-4">Contact Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={technicalForm.contactName}
                          onChange={(e) => setTechnicalForm({...technicalForm, contactName: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Email *</label>
                        <input
                          type="email"
                          value={technicalForm.contactEmail}
                          onChange={(e) => setTechnicalForm({...technicalForm, contactEmail: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-sunny-brown mb-1">Company Name</label>
                      <input
                        type="text"
                        value={technicalForm.companyName}
                        onChange={(e) => setTechnicalForm({...technicalForm, companyName: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="border-b border-sunny-gold/20 pb-6">
                    <h3 className="font-bold text-sunny-red mb-4">Project Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Project Name *</label>
                        <input
                          type="text"
                          value={technicalForm.projectName}
                          onChange={(e) => setTechnicalForm({...technicalForm, projectName: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Project Type *</label>
                        <select
                          value={technicalForm.projectType}
                          onChange={(e) => setTechnicalForm({...technicalForm, projectType: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        >
                          <option value="">Select type...</option>
                          <option value="website">Website</option>
                          <option value="webapp">Web Application</option>
                          <option value="desktop">Desktop Application</option>
                          <option value="mobile">Mobile Application</option>
                          <option value="ecommerce">E-Commerce Platform</option>
                          <option value="api">API/Backend Service</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Project Description *</label>
                        <textarea
                          value={technicalForm.projectDescription}
                          onChange={(e) => setTechnicalForm({...technicalForm, projectDescription: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none h-24 resize-none"
                          placeholder="Describe your project goals and vision..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Target Audience</label>
                        <input
                          type="text"
                          value={technicalForm.targetAudience}
                          onChange={(e) => setTechnicalForm({...technicalForm, targetAudience: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                          placeholder="Who will use this application?"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technical Requirements */}
                  <div className="border-b border-sunny-gold/20 pb-6">
                    <h3 className="font-bold text-sunny-red mb-4">Technical Requirements</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Preferred Tech Stack</label>
                        <input
                          type="text"
                          value={technicalForm.techStack}
                          onChange={(e) => setTechnicalForm({...technicalForm, techStack: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                          placeholder="e.g., React, Node.js, PostgreSQL (leave blank if no preference)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Features & Functionality *</label>
                        <textarea
                          value={technicalForm.features}
                          onChange={(e) => setTechnicalForm({...technicalForm, features: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none h-24 resize-none"
                          placeholder="List all required features and functionality..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Third-Party Integrations</label>
                        <textarea
                          value={technicalForm.integrations}
                          onChange={(e) => setTechnicalForm({...technicalForm, integrations: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none h-20 resize-none"
                          placeholder="List any APIs, services, or platforms to integrate with..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Hosting Preference</label>
                        <select
                          value={technicalForm.hostingPreference}
                          onChange={(e) => setTechnicalForm({...technicalForm, hostingPreference: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        >
                          <option value="">Select preference...</option>
                          <option value="cloud">Cloud (AWS, Google Cloud, Azure)</option>
                          <option value="vercel">Vercel/Netlify</option>
                          <option value="dedicated">Dedicated Server</option>
                          <option value="client">Client Manages</option>
                          <option value="recommendation">Need Recommendation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Project Logistics */}
                  <div className="border-b border-sunny-gold/20 pb-6">
                    <h3 className="font-bold text-sunny-red mb-4">Project Logistics</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Timeline *</label>
                        <select
                          value={technicalForm.timeline}
                          onChange={(e) => setTechnicalForm({...technicalForm, timeline: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        >
                          <option value="">Select timeline...</option>
                          <option value="asap">ASAP (Rush)</option>
                          <option value="1month">1 Month</option>
                          <option value="2-3months">2-3 Months</option>
                          <option value="3-6months">3-6 Months</option>
                          <option value="flexible">Flexible</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sunny-brown mb-1">Budget Range *</label>
                        <select
                          value={technicalForm.budget}
                          onChange={(e) => setTechnicalForm({...technicalForm, budget: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                        >
                          <option value="">Select budget...</option>
                          <option value="under5k">Under $5,000</option>
                          <option value="5k-10k">$5,000 - $10,000</option>
                          <option value="10k-25k">$10,000 - $25,000</option>
                          <option value="25k-50k">$25,000 - $50,000</option>
                          <option value="50k+">$50,000+</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-sunny-brown mb-1">Design Status</label>
                      <select
                        value={technicalForm.designStatus}
                        onChange={(e) => setTechnicalForm({...technicalForm, designStatus: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                      >
                        <option value="">Select status...</option>
                        <option value="completed">Design Completed</option>
                        <option value="in-progress">Design In Progress</option>
                        <option value="need-design">Need Design Services</option>
                        <option value="no-design">No Design Needed</option>
                      </select>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-sunny-brown mb-1">Additional Notes</label>
                    <textarea
                      value={technicalForm.additionalNotes}
                      onChange={(e) => setTechnicalForm({...technicalForm, additionalNotes: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none h-24 resize-none"
                      placeholder="Any other requirements, constraints, or information..."
                    />
                  </div>

                  <button
                    onClick={handleTechnicalSubmit}
                    disabled={!technicalForm.contactName || !technicalForm.contactEmail || !technicalForm.projectName || !technicalForm.projectType || !technicalForm.projectDescription || !technicalForm.features || !technicalForm.timeline || !technicalForm.budget}
                    className="w-full bg-sunny-ocean hover:bg-sunny-ocean/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
                  >
                    <Send className="w-5 h-5 inline mr-2" />
                    Submit Technical Requirements
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto pt-8">
            <button
              onClick={() => setMode('selection')}
              className="flex items-center gap-2 text-sunny-brown hover:text-sunny-red transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <Code2 className="w-16 h-16 text-sunny-ocean mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-sunny-darkRed mb-4">
                  Technical Requirements
                </h2>
                <p className="text-sunny-brown/80">
                  Choose how you'd like to provide your project specifications
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Fill Online Option */}
                <button
                  onClick={() => setTechnicalView('form')}
                  className="bg-sunny-ocean/10 backdrop-blur rounded-xl p-6 text-left hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-ocean/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-6 h-6 text-sunny-ocean" />
                    <h3 className="font-bold text-sunny-darkRed">Fill Out Online</h3>
                  </div>
                  <p className="text-sm text-sunny-brown/80 mb-4">
                    Complete the comprehensive technical requirements form right here and submit directly.
                  </p>
                  <div className="flex items-center gap-2 text-sunny-ocean text-sm">
                    <span>Start Form</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Download Option */}
                <button
                  onClick={downloadTechnicalDoc}
                  className="bg-sunny-gold/10 backdrop-blur rounded-xl p-6 text-left hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-gold/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="w-6 h-6 text-sunny-gold" />
                    <h3 className="font-bold text-sunny-darkRed">Download Template</h3>
                  </div>
                  <p className="text-sm text-sunny-brown/80 mb-4">
                    Get the PDF template to fill out offline and email back at your convenience.
                  </p>
                  <div className="flex items-center gap-2 text-sunny-gold text-sm">
                    <span>Download PDF</span>
                    <Download className="w-4 h-4" />
                  </div>
                </button>
              </div>

              <div className="mt-8 p-4 bg-sunny-cream/50 rounded-lg text-center">
                <p className="text-sm text-sunny-brown/70">
                  Questions? Email me directly at{' '}
                  <a href="mailto:luka@sunny-stack.com" className="text-sunny-red hover:text-sunny-darkRed">
                    luka@sunny-stack.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Guided Mode
  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto pt-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sunny-brown hover:text-sunny-red transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <span className="text-sm text-sunny-brown/60">
                Step {currentStep + 1} of {guidedSteps.length}
              </span>
            </div>
            <div className="w-full bg-sunny-gold/20 rounded-full h-2">
              <div 
                className="bg-sunny-gradient h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / guidedSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8">
            {/* Step Content */}
            {guidedSteps[currentStep] === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Let's start with introductions!</h2>
                  <p className="text-sunny-brown/80">How can I reach you about this project?</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-sunny-brown mb-1">Your Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-sunny-brown mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-sunny-brown mb-1">Company (Optional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none"
                      placeholder="Awesome Corp"
                    />
                  </div>
                </div>
              </div>
            )}

            {guidedSteps[currentStep] === 'projectType' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">What are we building?</h2>
                  <p className="text-sunny-brown/80">Choose the option that best describes your project</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'website', label: 'Website', description: 'Marketing site, portfolio, blog' },
                    { value: 'webapp', label: 'Web App', description: 'Interactive application, SaaS, dashboard' },
                    { value: 'desktop', label: 'Desktop App', description: 'Windows, Mac, or cross-platform' },
                    { value: 'mobile', label: 'Mobile App', description: 'iOS, Android, or cross-platform' },
                    { value: 'ecommerce', label: 'E-Commerce', description: 'Online store, marketplace, payments' },
                    { value: 'other', label: 'Something Else', description: 'API, automation, or custom solution' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({...formData, projectType: type.value as ProjectType})}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.projectType === type.value
                          ? 'border-sunny-red bg-sunny-red/10'
                          : 'border-sunny-gold/30 hover:border-sunny-gold'
                      }`}
                    >
                      <div className="font-medium text-sunny-darkRed mb-1">{type.label}</div>
                      <div className="text-xs text-sunny-brown/60">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedSteps[currentStep] === 'description' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Tell me about your vision</h2>
                  <p className="text-sunny-brown/80">Don't worry about technical terms - just describe what you want!</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-sunny-brown mb-1">Project Description</label>
                  <textarea
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({...formData, projectDescription: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none h-32 resize-none"
                    placeholder="I want to build an app that helps people track their daily water intake. It should send reminders and show progress..."
                  />
                </div>
              </div>
            )}

            {guidedSteps[currentStep] === 'features' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">What features do you need?</h2>
                  <p className="text-sunny-brown/80">Select all that apply</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    'User accounts/login',
                    'Payment processing', 
                    'Email notifications',
                    'File uploads',
                    'Search functionality',
                    'Admin dashboard',
                    'Analytics/reporting',
                    'Third-party integrations',
                    'Real-time updates',
                    'Mobile responsive',
                    'Other'
                  ].map((feature) => (
                    <div key={feature}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature) || 
                                  (feature === 'Other' && formData.features.some(f => f.startsWith('Other:')))}
                          onChange={(e) => {
                            if (feature === 'Other') {
                              if (e.target.checked) {
                                setFormData({...formData, features: [...formData.features.filter(f => !f.startsWith('Other:')), 'Other: ']})
                              } else {
                                setFormData({...formData, features: formData.features.filter(f => !f.startsWith('Other:'))})
                              }
                            } else {
                              if (e.target.checked) {
                                setFormData({...formData, features: [...formData.features, feature]})
                              } else {
                                setFormData({...formData, features: formData.features.filter(f => f !== feature)})
                              }
                            }
                          }}
                          className="w-5 h-5 text-sunny-red rounded border-2 border-sunny-gold/30"
                        />
                        <span className="text-sunny-brown">{feature}</span>
                      </label>
                      
                      {feature === 'Other' && formData.features.some(f => f.startsWith('Other:')) && (
                        <div className="ml-8 mt-2">
                          <input
                            type="text"
                            placeholder="Please describe what else you need..."
                            value={formData.features.find(f => f.startsWith('Other:'))?.substring(7) || ''}
                            onChange={(e) => {
                              const otherFeatures = formData.features.filter(f => !f.startsWith('Other:'))
                              if (e.target.value) {
                                setFormData({
                                  ...formData, 
                                  features: [...otherFeatures, `Other: ${e.target.value}`]
                                })
                              } else {
                                setFormData({
                                  ...formData, 
                                  features: otherFeatures
                                })
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {guidedSteps[currentStep] === 'timeline' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">When do you need this?</h2>
                  <p className="text-sunny-brown/80">This helps me prioritize and plan accordingly</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { value: 'asap', label: 'ASAP', description: 'Need it yesterday!' },
                    { value: '1month', label: 'Within 1 month', description: 'Quick turnaround' },
                    { value: '3months', label: 'Within 3 months', description: 'Standard timeline' },
                    { value: 'flexible', label: 'Flexible', description: 'No rush, quality first' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, timeline: option.value as Timeline})}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        formData.timeline === option.value
                          ? 'border-sunny-red bg-sunny-red/10'
                          : 'border-sunny-gold/30 hover:border-sunny-gold'
                      }`}
                    >
                      <div className="font-medium text-sunny-darkRed">{option.label}</div>
                      <div className="text-sm text-sunny-brown/60">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedSteps[currentStep] === 'budget' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Budget range</h2>
                  <p className="text-sunny-brown/80">This helps me suggest the best solution for your needs</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { value: 'under5k', label: 'Under $5,000', description: 'Essential features, MVP' },
                    { value: '5k-10k', label: '$5,000 - $10,000', description: 'Full-featured solution' },
                    { value: '10k-25k', label: '$10,000 - $25,000', description: 'Complex application' },
                    { value: '25k+', label: '$25,000+', description: 'Enterprise solution' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, budget: option.value as Budget})}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        formData.budget === option.value
                          ? 'border-sunny-red bg-sunny-red/10'
                          : 'border-sunny-gold/30 hover:border-sunny-gold'
                      }`}
                    >
                      <div className="font-medium text-sunny-darkRed">{option.label}</div>
                      <div className="text-sm text-sunny-brown/60">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedSteps[currentStep] === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Perfect! Let's review</h2>
                  <p className="text-sunny-brown/80">Here's what I've gathered about your project</p>
                </div>
                
                <div className="bg-sunny-gold/10 rounded-lg p-6 space-y-3">
                  <div>
                    <span className="font-medium text-sunny-brown">Contact:</span>
                    <span className="ml-2 text-sunny-brown/80">{formData.name} ({formData.email})</span>
                  </div>
                  <div>
                    <span className="font-medium text-sunny-brown">Project Type:</span>
                    <span className="ml-2 text-sunny-brown/80">{formData.projectType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-sunny-brown">Timeline:</span>
                    <span className="ml-2 text-sunny-brown/80">{formData.timeline}</span>
                  </div>
                  <div>
                    <span className="font-medium text-sunny-brown">Budget:</span>
                    <span className="ml-2 text-sunny-brown/80">{formData.budget}</span>
                  </div>
                  {formData.features.length > 0 && (
                    <div>
                      <span className="font-medium text-sunny-brown">Features:</span>
                      <span className="ml-2 text-sunny-brown/80">{formData.features.join(', ')}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Send className="w-5 h-5 inline mr-2" />
                  Send My Project Request
                </button>
              </div>
            )}

            {/* Navigation */}
            {guidedSteps[currentStep] !== 'review' && (
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  disabled={
                    (guidedSteps[currentStep] === 'contact' && (!formData.name || !formData.email)) ||
                    (guidedSteps[currentStep] === 'projectType' && !formData.projectType) ||
                    (guidedSteps[currentStep] === 'timeline' && !formData.timeline) ||
                    (guidedSteps[currentStep] === 'budget' && !formData.budget)
                  }
                  className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}