# Sunny Stack Portfolio

![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![React](https://img.shields.io/badge/React-19.0-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen)

A modern, responsive portfolio website showcasing professional web development projects and skills.

## 🚀 Overview

A high-performance portfolio website built with the latest web technologies. Features a clean, modern design with smooth animations, fully responsive layouts, and optimized for both desktop and mobile experiences.

### ✨ Key Features

- **Responsive Design** - Seamless experience across all devices
- **Performance Optimized** - Lightning-fast load times with Next.js 15
- **Type-Safe** - Full TypeScript implementation for reliability
- **Modern UI** - Clean, professional interface with Tailwind CSS
- **Contact Forms** - Integrated contact and quote request systems
- **SEO Ready** - Optimized meta tags and structured data
- **Accessibility** - WCAG AA compliant

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15.0 (App Router)
- **UI Library:** React 19.0
- **Language:** TypeScript 5.5
- **Styling:** Tailwind CSS 3.4
- **Fonts:** Geist Font Family

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Testing:** Jest & React Testing Library
- **E2E Testing:** Playwright
- **Build Tool:** Webpack (via Next.js)

### Deployment
- **Platform:** Vercel
- **CI/CD:** Automated via Vercel
- **Analytics:** Vercel Analytics (optional)

## 📦 Installation

### Prerequisites
- Node.js 20.0 or higher
- npm 10.0 or higher

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/lukadfagundes/sunny-stack.git
   cd sunny-stack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
npm run type-check  # Run TypeScript compiler check
```

## 📂 Project Structure

```
sunny-stack/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── (routes)/       # Page components
│   └── layout.tsx      # Root layout
├── components/         # Reusable React components
│   ├── forms/         # Form components
│   └── ui/            # UI components
├── lib/               # Utility functions and helpers
├── hooks/             # Custom React hooks
├── styles/            # Global styles
├── public/            # Static assets
├── __tests__/         # Unit tests
└── e2e/              # End-to-end tests
```

## 🌟 Features

### Pages
- **Home** - Welcome page with hero section
- **About** - Professional background and skills
- **Portfolio** - Project showcase with filtering
- **Resume** - Downloadable CV/Resume
- **Contact** - Get in touch form
- **Quote** - Project quotation system

### Technical Features
- Server-side rendering (SSR) for optimal performance
- Static site generation (SSG) where applicable
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- Font optimization with next/font
- SEO optimization with metadata API
- Progressive Web App (PWA) ready

## 🤝 Contributing

While this is a personal portfolio project, suggestions and feedback are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Luka D. Fagundes**

- GitHub: [@lukadfagundes](https://github.com/lukadfagundes)
- Portfolio: [www.sunny-stack.com](https://www.sunny-stack.com)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Open source community for invaluable resources

---

Built with ❤️ by Luka D. Fagundes © 2024