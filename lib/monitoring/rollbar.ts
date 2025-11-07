import Rollbar from 'rollbar';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN || 'development-token',
  environment: process.env.NODE_ENV || 'development',
  enabled: isProduction, // Only send to Rollbar in production
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    code_version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    server: {
      root: 'https://sunny-stack.com',
    },
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        guess_uncaught_frames: true,
      },
    },
  },
});

// Helper functions for common use cases
export function logError(error: Error, context?: Record<string, unknown>) {
  if (isProduction) {
    rollbar.error(error, context);
  } else if (isDevelopment) {
    console.error('[Rollbar Mock]', error, context);
  }
}

export function logWarning(message: string, context?: Record<string, unknown>) {
  if (isProduction) {
    rollbar.warning(message, context);
  } else if (isDevelopment) {
    console.warn('[Rollbar Mock]', message, context);
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  if (isProduction) {
    rollbar.info(message, context);
  } else if (isDevelopment) {
    console.info('[Rollbar Mock]', message, context);
  }
}
