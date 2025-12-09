/**
 * Authentication Diagnostics Tool
 * 
 * This utility helps diagnose authentication issues by checking:
 * - Token presence and validity
 * - Token format (JWT structure)
 * - API service state
 * - Network connectivity
 * - Error message patterns
 */

import { apiService } from '../services/api';

export interface DiagnosticResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export interface DiagnosticsReport {
  timestamp: string;
  results: DiagnosticResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Checks if a JWT token is valid (not expired)
 */
function isTokenExpired(token: string): { expired: boolean; expiresAt?: Date; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { expired: true, error: 'Invalid JWT format: token must have 3 parts' };
    }

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) {
      return { expired: true, error: 'Token missing expiration (exp) claim' };
    }

    const expiresAt = new Date(exp * 1000);
    const now = new Date();
    const expired = exp < Math.floor(now.getTime() / 1000);

    return { expired, expiresAt };
  } catch (error: any) {
    return { expired: true, error: `Token parsing failed: ${error.message}` };
  }
}

/**
 * Decodes JWT payload for inspection
 */
function decodeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Runs comprehensive authentication diagnostics
 */
export async function runAuthDiagnostics(): Promise<DiagnosticsReport> {
  const results: DiagnosticResult[] = [];
  const timestamp = new Date().toISOString();

  // 1. Check token presence in localStorage
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  results.push({
    check: 'Access Token in localStorage',
    status: accessToken ? 'pass' : 'fail',
    message: accessToken ? 'Access token found in localStorage' : 'Access token not found in localStorage',
    details: accessToken ? { length: accessToken.length } : undefined
  });

  results.push({
    check: 'Refresh Token in localStorage',
    status: refreshToken ? 'pass' : 'warning',
    message: refreshToken ? 'Refresh token found in localStorage' : 'Refresh token not found (optional for single-session apps)',
    details: refreshToken ? { length: refreshToken.length } : undefined
  });

  // 2. Check token format (JWT structure)
  if (accessToken) {
    const parts = accessToken.split('.');
    results.push({
      check: 'Access Token JWT Format',
      status: parts.length === 3 ? 'pass' : 'fail',
      message: parts.length === 3 
        ? 'Access token has valid JWT structure (3 parts)' 
        : `Access token has invalid JWT structure (${parts.length} parts, expected 3)`,
      details: {
        parts: parts.length,
        headerLength: parts[0]?.length || 0,
        payloadLength: parts[1]?.length || 0,
        signatureLength: parts[2]?.length || 0
      }
    });

    // Decode token payload
    const payload = decodeToken(accessToken);
    if (payload) {
      results.push({
        check: 'Access Token Payload',
        status: 'pass',
        message: 'Token payload decoded successfully',
        details: {
          userId: payload.sub || payload.userId || payload.id || 'Not found',
          email: payload.email || 'Not found',
          role: payload.role || 'Not found',
          issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Not found',
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Not found'
        }
      });
    }
  }

  // 3. Check token expiration
  if (accessToken) {
    const expirationCheck = isTokenExpired(accessToken);
    results.push({
      check: 'Access Token Expiration',
      status: expirationCheck.expired ? 'fail' : 'pass',
      message: expirationCheck.expired
        ? `Access token is expired${expirationCheck.expiresAt ? ` (expired at ${expirationCheck.expiresAt.toISOString()})` : ''}`
        : expirationCheck.expiresAt
        ? `Access token is valid (expires at ${expirationCheck.expiresAt.toISOString()})`
        : 'Access token expiration could not be determined',
      details: {
        expired: expirationCheck.expired,
        expiresAt: expirationCheck.expiresAt?.toISOString(),
        error: expirationCheck.error
      }
    });
  }

  if (refreshToken) {
    const expirationCheck = isTokenExpired(refreshToken);
    results.push({
      check: 'Refresh Token Expiration',
      status: expirationCheck.expired ? 'fail' : 'pass',
      message: expirationCheck.expired
        ? `Refresh token is expired${expirationCheck.expiresAt ? ` (expired at ${expirationCheck.expiresAt.toISOString()})` : ''}`
        : expirationCheck.expiresAt
        ? `Refresh token is valid (expires at ${expirationCheck.expiresAt.toISOString()})`
        : 'Refresh token expiration could not be determined',
      details: {
        expired: expirationCheck.expired,
        expiresAt: expirationCheck.expiresAt?.toISOString()
      }
    });
  }

  // 4. Check API Service state
  results.push({
    check: 'API Service Authentication State',
    status: apiService.isAuthenticated() ? 'pass' : 'fail',
    message: apiService.isAuthenticated() 
      ? 'API Service reports user as authenticated'
      : 'API Service reports user as not authenticated',
    details: {
      isAuthenticated: apiService.isAuthenticated()
    }
  });

  // 5. Test token in Authorization header format
  if (accessToken) {
    const authHeader = `Bearer ${accessToken}`;
    results.push({
      check: 'Authorization Header Format',
      status: 'pass',
      message: 'Authorization header can be constructed',
      details: {
        headerLength: authHeader.length,
        prefix: authHeader.substring(0, 7) // "Bearer "
      }
    });
  }

  // 6. Check API base URL configuration
  try {
    const configModule = await import('../config/environment');
    const apiConfig = configModule.api || configModule.config?.api;
    const baseUrl = apiConfig?.baseUrl;
    
    results.push({
      check: 'API Base URL Configuration',
      status: baseUrl ? 'pass' : 'fail',
      message: baseUrl 
        ? `API base URL configured: ${baseUrl}`
        : 'API base URL is not configured',
      details: {
        baseUrl: baseUrl || 'Not set'
      }
    });
  } catch (error: any) {
    results.push({
      check: 'API Base URL Configuration',
      status: 'fail',
      message: `Failed to load API configuration: ${error.message}`,
      details: { error: error.message }
    });
  }

  // 7. Test network connectivity (optional, might fail if server is down)
  try {
    const configModule = await import('../config/environment');
    const apiConfig = configModule.api || configModule.config?.api;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    if (!apiConfig?.baseUrl) {
      throw new Error('API base URL not configured');
    }
    
    const response = await fetch(`${apiConfig.baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    results.push({
      check: 'API Server Connectivity',
      status: response.ok ? 'pass' : 'warning',
      message: response.ok 
        ? 'API server is reachable'
        : `API server responded with status ${response.status}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        url: `${apiConfig.baseUrl}/health`
      }
    });
  } catch (error: any) {
    results.push({
      check: 'API Server Connectivity',
      status: 'warning',
      message: `Could not reach API server: ${error.message}`,
      details: {
        error: error.message,
        note: 'This might be normal if the server is down or /health endpoint does not exist'
      }
    });
  }

  // 8. Check for common error patterns in localStorage
  const errorLog = localStorage.getItem('auth_error_log');
  if (errorLog) {
    try {
      const errors = JSON.parse(errorLog);
      results.push({
        check: 'Recent Authentication Errors',
        status: errors.length > 0 ? 'warning' : 'pass',
        message: errors.length > 0
          ? `Found ${errors.length} recent authentication error(s) in log`
          : 'No recent authentication errors found',
        details: {
          errorCount: errors.length,
          recentErrors: errors.slice(0, 5) // Last 5 errors
        }
      });
    } catch {
      // Ignore parse errors
    }
  }

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    warnings: results.filter(r => r.status === 'warning').length
  };

  return {
    timestamp,
    results,
    summary
  };
}

/**
 * Logs an authentication error to localStorage for diagnostics
 */
export function logAuthError(error: any, context?: string) {
  try {
    const errorLog = localStorage.getItem('auth_error_log');
    const errors = errorLog ? JSON.parse(errorLog) : [];
    
    errors.push({
      timestamp: new Date().toISOString(),
      context: context || 'Unknown',
      message: error.message || String(error),
      stack: error.stack,
      type: error.name || 'Error'
    });

    // Keep only last 20 errors
    if (errors.length > 20) {
      errors.shift();
    }

    localStorage.setItem('auth_error_log', JSON.stringify(errors));
  } catch {
    // Silently fail if logging fails
  }
}

/**
 * Clears the authentication error log
 */
export function clearAuthErrorLog() {
  localStorage.removeItem('auth_error_log');
}

/**
 * Prints diagnostics report to console in a readable format
 */
export function printDiagnosticsReport(report: DiagnosticsReport) {
  console.group('🔍 Authentication Diagnostics Report');
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Summary: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings\n`);
  
  report.results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.check}: ${result.message}`);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });
  
  console.groupEnd();
  return report;
}

/**
 * Exposes diagnostics tools to window object for browser console access
 * Usage: window.authDiagnostics.run()
 */
export function exposeDiagnosticsToWindow() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).authDiagnostics = {
      run: async () => {
        const report = await runAuthDiagnostics();
        return printDiagnosticsReport(report);
      },
      runSilent: runAuthDiagnostics,
      logError: logAuthError,
      clearErrorLog: clearAuthErrorLog,
      printReport: printDiagnosticsReport
    };
    
    console.log('%c🔧 Auth Diagnostics Available', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('%cRun window.authDiagnostics.run() in the console to diagnose authentication issues', 'color: #6b7280; font-size: 12px;');
  }
}

