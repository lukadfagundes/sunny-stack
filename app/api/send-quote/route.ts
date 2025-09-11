import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with your API key
// You'll need to sign up at https://resend.com and get an API key
const resend = new Resend(process.env.RESEND_API_KEY)

console.log('Resend initialized with API key:', process.env.RESEND_API_KEY ? 'Key present' : 'KEY MISSING!')

export async function POST(request: Request) {
  console.log('API Route called - starting email send process')
  
  try {
    const body = await request.json()
    console.log('Request body received:', { ...body, email: '***', contactEmail: '***' })
    
    // Determine which type of form was submitted
    const isGuidedForm = body.formType === 'guided'
    const isTechnicalForm = body.formType === 'technical'
    
    // Format the email content based on form type
    let emailHtml = ''
    let subject = ''
    
    if (isGuidedForm) {
      // Guided form submission
      subject = `New Project Request from ${body.name}`
      emailHtml = `
        <h2>New Project Request (Guided Form)</h2>
        
        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Company:</strong> ${body.company || 'Not provided'}</p>
        
        <h3>Project Details</h3>
        <p><strong>Project Type:</strong> ${body.projectType}</p>
        <p><strong>Description:</strong></p>
        <p>${body.projectDescription}</p>
        
        <h3>Features Requested</h3>
        <ul>
          ${body.features.map((feature: string) => `<li>${feature}</li>`).join('')}
        </ul>
        
        <h3>Project Logistics</h3>
        <p><strong>Timeline:</strong> ${body.timeline}</p>
        <p><strong>Budget:</strong> ${body.budget}</p>
        
        <hr>
        <p><em>This request was submitted via the guided form on sunny-stack.com</em></p>
      `
    } else if (isTechnicalForm) {
      // Technical form submission
      subject = `Technical Requirements from ${body.contactName}`
      emailHtml = `
        <h2>Technical Requirements Submission</h2>
        
        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${body.contactName}</p>
        <p><strong>Email:</strong> ${body.contactEmail}</p>
        <p><strong>Company:</strong> ${body.companyName || 'Not provided'}</p>
        
        <h3>Project Overview</h3>
        <p><strong>Project Name:</strong> ${body.projectName}</p>
        <p><strong>Project Type:</strong> ${body.projectType}</p>
        <p><strong>Description:</strong></p>
        <p>${body.projectDescription}</p>
        <p><strong>Target Audience:</strong> ${body.targetAudience || 'Not specified'}</p>
        
        <h3>Technical Requirements</h3>
        <p><strong>Tech Stack:</strong> ${body.techStack || 'No preference'}</p>
        <p><strong>Features & Functionality:</strong></p>
        <p>${body.features}</p>
        <p><strong>Integrations:</strong></p>
        <p>${body.integrations || 'None specified'}</p>
        <p><strong>Hosting Preference:</strong> ${body.hostingPreference || 'Not specified'}</p>
        
        <h3>Project Logistics</h3>
        <p><strong>Timeline:</strong> ${body.timeline}</p>
        <p><strong>Budget Range:</strong> ${body.budget}</p>
        <p><strong>Design Status:</strong> ${body.designStatus || 'Not specified'}</p>
        
        <h3>Additional Notes</h3>
        <p>${body.additionalNotes || 'None'}</p>
        
        <hr>
        <p><em>This request was submitted via the technical form on sunny-stack.com</em></p>
      `
    }
    
    // Send the email using Resend
    const data = await resend.emails.send({
      from: 'Sunny Stack Forms <forms@sunny-stack.com>', // Using your verified domain
      to: ['luka@sunny-stack.com'],
      subject: subject,
      html: emailHtml,
      reply_to: isGuidedForm ? body.email : body.contactEmail,
    })
    
    console.log('Email sent successfully:', data)
    
    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}