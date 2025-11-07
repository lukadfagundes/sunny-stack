/**
 * Unit Tests for Navigation Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navigation from '@/components/Navigation';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe('Navigation', () => {
  const mockUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render navigation', () => {
      render(<Navigation />);
      expect(screen.getByText('Sunny Stack')).toBeInTheDocument();
    });

    test('should render all navigation items in desktop menu', () => {
      render(<Navigation />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    test('should render contact button', () => {
      render(<Navigation />);
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    test('should render logo with link to home', () => {
      render(<Navigation />);
      const logo = screen.getByText('Sunny Stack');
      expect(logo.closest('a')).toHaveAttribute('href', '/');
    });

    test('should not show mobile menu by default', () => {
      const { container } = render(<Navigation />);
      // Mobile menu is hidden by default (no visible mobile menu items)
      const mobileNav = container.querySelector('.md\\:hidden.py-4');
      expect(mobileNav).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    test('should highlight Home when on home page', () => {
      mockUsePathname.mockReturnValue('/');
      const { container } = render(<Navigation />);

      const homeLinks = container.querySelectorAll('a[href="/"]');
      const navHomeLinks = Array.from(homeLinks).filter(link =>
        link.textContent?.includes('Home')
      );

      navHomeLinks.forEach(link => {
        expect(link).toHaveClass('bg-sunny-red');
      });
    });

    test('should highlight About when on about page', () => {
      mockUsePathname.mockReturnValue('/about');
      const { container } = render(<Navigation />);

      const aboutLinks = container.querySelectorAll('a[href="/about"]');
      aboutLinks.forEach(link => {
        expect(link).toHaveClass('bg-sunny-red');
      });
    });

    test('should highlight Portfolio when on portfolio page', () => {
      mockUsePathname.mockReturnValue('/portfolio');
      const { container } = render(<Navigation />);

      const portfolioLinks = container.querySelectorAll('a[href="/portfolio"]');
      portfolioLinks.forEach(link => {
        expect(link).toHaveClass('bg-sunny-red');
      });
    });

    test('should not highlight inactive items', () => {
      mockUsePathname.mockReturnValue('/');
      const { container } = render(<Navigation />);

      const aboutLinks = container.querySelectorAll('a[href="/about"]');
      aboutLinks.forEach(link => {
        expect(link).not.toHaveClass('bg-sunny-red');
        expect(link).toHaveClass('text-sunny-brown');
      });
    });
  });

  describe('Scroll Behavior', () => {
    test('should apply scrolled styles when scrolled down', async () => {
      const { container } = render(<Navigation />);
      const nav = container.querySelector('nav');

      // Initially not scrolled
      expect(nav).toHaveClass('bg-transparent');
      expect(nav).not.toHaveClass('bg-white/95');

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
      fireEvent.scroll(window);

      await waitFor(() => {
        expect(nav).toHaveClass('bg-white/95');
        expect(nav).toHaveClass('backdrop-blur-md');
        expect(nav).toHaveClass('shadow-lg');
      });
    });

    test('should not apply scrolled styles when at top', () => {
      const { container } = render(<Navigation />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('bg-transparent');
      expect(nav).not.toHaveClass('shadow-lg');
    });
  });

  describe('Mobile Menu', () => {
    test('should toggle mobile menu when button clicked', () => {
      render(<Navigation />);

      const menuButton = screen.getByLabelText('Toggle menu');

      // Initially closed
      expect(screen.queryByRole('link', { name: /Home/i })).toBeInTheDocument();

      // Click to open
      fireEvent.click(menuButton);

      // Menu should be visible
      expect(screen.getAllByText('Home').length).toBeGreaterThan(1);
    });

    test('should show X icon when menu is open', () => {
      const { container } = render(<Navigation />);

      const menuButton = screen.getByLabelText('Toggle menu');

      // Click to open
      fireEvent.click(menuButton);

      // Should show X icon (component renders X when open)
      const xIcon = container.querySelector('.lucide-x');
      expect(xIcon).toBeInTheDocument();
    });

    test('should close mobile menu when navigation item clicked', () => {
      render(<Navigation />);

      const menuButton = screen.getByLabelText('Toggle menu');

      // Open menu
      fireEvent.click(menuButton);

      // Click a nav item in mobile menu
      const mobileLinks = screen.getAllByText('About');
      const mobileAboutLink = mobileLinks[mobileLinks.length - 1]; // Get mobile menu link
      fireEvent.click(mobileAboutLink);

      // Menu should close (X icon should be gone)
      waitFor(() => {
        const menuIcon = screen.getByLabelText('Toggle menu');
        expect(menuIcon.querySelector('.lucide-menu')).toBeInTheDocument();
      });
    });

    test('should close mobile menu when contact button clicked', () => {
      render(<Navigation />);

      const menuButton = screen.getByLabelText('Toggle menu');

      // Open menu
      fireEvent.click(menuButton);

      // Click contact in mobile menu
      const contactButtons = screen.getAllByText('Contact');
      const mobileContactButton = contactButtons[contactButtons.length - 1];
      fireEvent.click(mobileContactButton);

      // Menu should close
      waitFor(() => {
        const menuIcon = screen.getByLabelText('Toggle menu');
        expect(menuIcon.querySelector('.lucide-menu')).toBeInTheDocument();
      });
    });
  });

  describe('Links', () => {
    test('should have correct href for all navigation items', () => {
      const { container } = render(<Navigation />);

      expect(container.querySelector('a[href="/"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/about"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/portfolio"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/resume"]')).toBeInTheDocument();
      expect(container.querySelector('a[href="/contact"]')).toBeInTheDocument();
    });

    test('should render icons for navigation items', () => {
      const { container } = render(<Navigation />);

      // Check that icons are rendered (lucide-react renders SVGs)
      const links = container.querySelectorAll('a');
      let hasIcons = false;
      links.forEach(link => {
        if (link.querySelector('svg')) {
          hasIcons = true;
        }
      });
      expect(hasIcons).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    test('should have hidden class for desktop navigation on mobile', () => {
      const { container } = render(<Navigation />);

      const desktopNav = container.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    test('should have mobile menu button visible', () => {
      render(<Navigation />);

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass('md:hidden');
    });
  });

  describe('Accessibility', () => {
    test('should have aria-label on menu button', () => {
      render(<Navigation />);

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
    });

    test('should have proper nav structure', () => {
      const { container } = render(<Navigation />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('should have focusable links', () => {
      const { container } = render(<Navigation />);

      const links = container.querySelectorAll('a');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Styling', () => {
    test('should have fixed positioning', () => {
      const { container } = render(<Navigation />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('top-0');
      expect(nav).toHaveClass('z-50');
    });

    test('should have transition classes', () => {
      const { container } = render(<Navigation />);
      const nav = container.querySelector('nav');

      expect(nav).toHaveClass('transition-all');
      expect(nav).toHaveClass('duration-300');
    });

    test('should apply sunny gradient to logo', () => {
      const { container } = render(<Navigation />);
      const logo = container.querySelector('.bg-sunny-gradient');

      expect(logo).toBeInTheDocument();
      expect(logo).toHaveClass('bg-clip-text');
      expect(logo).toHaveClass('text-transparent');
    });

    test('should style contact button with red background', () => {
      const { container } = render(<Navigation />);

      const contactLinks = container.querySelectorAll('a[href="/contact"]');
      contactLinks.forEach(link => {
        expect(link).toHaveClass('bg-sunny-red');
      });
    });
  });
});
