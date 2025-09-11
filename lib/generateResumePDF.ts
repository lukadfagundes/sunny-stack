import jsPDF from 'jspdf';

export const generateResumePDF = () => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const lineHeight = 6;
  let yPosition = margin + 10;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Add section separator
  const addSeparator = () => {
    yPosition += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  // Header - centered
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const nameWidth = doc.getTextWidth('LUKA FAGUNDES');
  doc.text('LUKA FAGUNDES', (pageWidth - nameWidth) / 2, yPosition);
  yPosition += 8;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const titleWidth = doc.getTextWidth('Full Stack Developer');
  doc.text('Full Stack Developer', (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 6;
  
  doc.setFontSize(10);
  const contactInfo = 'Salem, OR | 318-332-9700 | luka@sunnystack.com | sunnystack.com';
  const contactWidth = doc.getTextWidth(contactInfo);
  doc.text(contactInfo, (pageWidth - contactWidth) / 2, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 8;

  // Professional Summary
  addSeparator();
  addText('PROFESSIONAL SUMMARY', 14, true, [0, 0, 0]);
  yPosition += 2;
  addText('Full Stack Developer with 10+ years of professional experience transitioning from business operations to software development. Specialized in building scalable web applications using React, Next.js, TypeScript, and Python. Demonstrated ability to identify business needs and develop technical solutions. Strong background in customer relationship management, technical support, and B2B sales.', 10, false);
  yPosition += 5;

  // Core Competencies
  addSeparator();
  addText('CORE COMPETENCIES', 14, true, [0, 0, 0]);
  yPosition += 2;
  
  const competencies = [
    'Full Stack Development • Web Application Architecture • RESTful API Design • Database Management',
    'Agile Methodologies • Git Version Control • CI/CD • Test-Driven Development • Code Review',
    'Technical Sales • B2B Sales • Customer Relationship Management • Technical Documentation',
    'Problem Solving • Requirements Analysis • Project Management • Cross-functional Collaboration'
  ];
  
  competencies.forEach(line => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 3;

  // Technical Skills
  addSeparator();
  addText('TECHNICAL SKILLS', 14, true, [0, 0, 0]);
  yPosition += 2;
  
  const skills = {
    'Languages': 'TypeScript, JavaScript, Python, Dart, HTML/CSS, SQL',
    'Frontend': 'React 19, Next.js 15, Flutter, Tailwind CSS, Framer Motion, Zustand',
    'Backend': 'FastAPI, Flask, Node.js, Express, SQLAlchemy, Uvicorn',
    'Database': 'PostgreSQL, SQLite, Redis, Cloudflare D1',
    'Tools': 'Git, VS Code, Docker, GitHub API, JWT Auth, REST APIs'
  };

  Object.entries(skills).forEach(([category, items]) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${category}: `, margin, yPosition);
    const categoryWidth = doc.getTextWidth(`${category}: `);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);  // Ensure skills text is same size as body text
    const skillText = items;
    const skillLines = doc.splitTextToSize(skillText, pageWidth - 2 * margin - categoryWidth);
    doc.text(skillLines[0], margin + categoryWidth, yPosition);
    if (skillLines.length > 1) {
      for (let i = 1; i < skillLines.length; i++) {
        yPosition += lineHeight;
        doc.text(skillLines[i], margin, yPosition);
      }
    }
    yPosition += lineHeight;
  });
  yPosition += 3;

  // Professional Experience
  addSeparator();
  addText('PROFESSIONAL EXPERIENCE', 14, true, [0, 0, 0]);
  yPosition += 2;

  const experience = [
    {
      title: 'Account Manager',
      company: 'Revelation Machinery',
      period: '2021 - Present',
      location: 'Salem, OR (Remote)',
      highlights: [
        'Source and sell used manufacturing equipment including CNC machines, lathes, and industrial tools',
        'Evaluate equipment condition, specifications, and market value for pricing strategies',
        'Build relationships with manufacturers and dealers to maintain inventory pipeline',
        'Identified gaps in equipment valuation tools, inspiring development of automated solutions'
      ]
    },
    {
      title: 'Customer Service Representative',
      company: 'TEJ Agency',
      period: '2013 - 2020',
      location: 'Louisiana',
      highlights: [
        'Supported bank protection and financial insurance products for 50+ financial institutions',
        'Resolved complex insurance claims and policy inquiries maintaining 99% satisfaction rate',
        'Navigated federal banking regulations and compliance requirements',
        'Trained new representatives on insurance products and customer service protocols'
      ]
    },
    {
      title: 'Manager / Server / Bartender',
      company: 'The Landing Restaurant',
      period: '2011 - 2020',
      location: 'Louisiana',
      highlights: [
        'Managed front-of-house operations at high-volume waterfront restaurant',
        'Handled staffing, scheduling, and daily crisis management in fast-paced environment',
        'Developed strong multitasking and problem-solving skills under pressure',
        'Built loyal customer base through exceptional service despite operational challenges'
      ]
    }
  ];

  experience.forEach((job) => {
    // Check for page break
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    // Job title - bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(job.title, margin, yPosition);
    
    // Company - right aligned
    doc.setFont('helvetica', 'normal');
    const companyText = job.company;
    const companyWidth = doc.getTextWidth(companyText);
    doc.text(companyText, pageWidth - margin - companyWidth, yPosition);
    yPosition += 5;
    
    // Period and location
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${job.period} | ${job.location}`, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    yPosition += 6;
    
    // Highlights
    job.highlights.forEach((highlight) => {
      const bulletText = `• ${highlight}`;
      const lines = doc.splitTextToSize(bulletText, pageWidth - 2 * margin - 5);
      lines.forEach((line: string, index: number) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(index === 0 ? line : `  ${line}`, margin + 2, yPosition);
        yPosition += 5;
      });
    });
    yPosition += 5;
  });

  // Projects Section
  addSeparator();
  addText('PROJECTS', 14, true, [0, 0, 0]);
  yPosition += 2;
  
  const projects = [
    {
      name: 'Enterprise Web Application - Portfolio Platform',
      tech: 'Next.js 15, React 19, TypeScript, Tailwind CSS, Responsive Design',
      description: 'Architected and deployed full-stack portfolio application with dynamic routing, interactive UI components, and PDF generation'
    },
    {
      name: 'Cross-Platform Desktop Application',
      tech: 'Flutter, Dart, State Management (Riverpod), REST API Integration, GitHub API',
      description: 'Engineered desktop application with 22+ microservices, implementing MVC architecture and real-time data synchronization'
    },
    {
      name: 'AI-Integrated SaaS Platform',
      tech: 'Python, Flask, FastAPI, PostgreSQL, OpenAI GPT-4, OCR Technology, JWT Authentication',
      description: 'Developed multi-tenant B2B platform with machine learning integration for automated equipment valuation and analysis'
    }
  ];

  projects.forEach((project) => {
    // Check for page break
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(project.name, margin, yPosition);
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(project.tech, margin, yPosition);
    yPosition += 5;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(project.description, pageWidth - 2 * margin);
    descLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 4;
  });

  // Save the PDF
  doc.save('Luka Fagundes Resume.pdf');
};