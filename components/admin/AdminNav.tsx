'use client';

/**
 * Admin Navigation Component
 *
 * Provides navigation sidebar for admin dashboard routes.
 * Includes route highlighting and responsive mobile menu.
 *
 * @module components/admin/AdminNav
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  FileOutput,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/admin/projects',
    icon: FolderKanban,
  },
  {
    label: 'Quotes',
    href: '/admin/quotes',
    icon: FileText,
  },
  {
    label: 'Proposals',
    href: '/admin/proposals',
    icon: FileOutput,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    router.push('/api/auth/signout');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Sunny Stack Admin
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Sunny Stack
            </h1>
            <p className="text-sm text-gray-600 mt-1">Admin Dashboard</p>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1 px-3">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-colors duration-200
                        ${
                          active
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        className={`h-5 w-5 ${active ? 'text-blue-700' : 'text-gray-500'}`}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="
                flex items-center gap-3 w-full px-3 py-2 rounded-lg
                text-gray-700 hover:bg-gray-100
                transition-colors duration-200
              "
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for desktop layout */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
