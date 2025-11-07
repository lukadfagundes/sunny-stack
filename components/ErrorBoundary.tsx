'use client';

import React, { Component, ReactNode } from 'react';
import { logError } from '@/lib/monitoring/rollbar';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'RootErrorBoundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-700 mb-4">
                We apologize for the inconvenience. Our team has been notified and is working on a fix.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
