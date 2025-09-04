import config from '../config/env.js';

/**
 * Validate environment configuration
 * @returns {Object} Validation result
 */
export const validateEnvironment = () => {
  const issues = [];
  const warnings = [];

  // Check required variables
  if (!config.apiBaseUrl || config.apiBaseUrl === '') {
    issues.push('VITE_API_BASE_URL is required');
  }

  if (!config.socketUrl || config.socketUrl === '') {
    issues.push('VITE_SOCKET_URL is required');
  }

  // Check URL formats
  try {
    new URL(config.apiBaseUrl);
  } catch {
    issues.push('VITE_API_BASE_URL must be a valid URL');
  }

  try {
    new URL(config.socketUrl);
  } catch {
    issues.push('VITE_SOCKET_URL must be a valid URL');
  }

  // Development warnings
  if (config.isDevelopment) {
    if (config.apiBaseUrl.includes('localhost')) {
      warnings.push('Using localhost for API - ensure backend is running on the correct port');
    }
    
    if (config.socketUrl.includes('localhost')) {
      warnings.push('Using localhost for Socket.IO - ensure backend WebSocket server is accessible');
    }
  }

  // Production warnings
  if (config.isProduction) {
    if (config.apiBaseUrl.includes('localhost')) {
      warnings.push('Using localhost in production - this may cause connection issues');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    config: {
      apiUrl: config.apiUrl,
      socketUrl: config.socketUrl,
      environment: config.nodeEnv,
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction
    }
  };
};

/**
 * Log environment configuration (development only)
 */
export const logEnvironmentInfo = () => {
  if (!config.isDevelopment) return;

  const validation = validateEnvironment();
  
  console.group('🔧 Environment Configuration');
  console.log('API URL:', validation.config.apiUrl);
  console.log('Socket URL:', validation.config.socketUrl);
  console.log('Environment:', validation.config.environment);
  console.log('Is Development:', validation.config.isDevelopment);
  
  if (validation.issues.length > 0) {
    console.group('❌ Issues');
    validation.issues.forEach(issue => console.error(issue));
    console.groupEnd();
  }
  
  if (validation.warnings.length > 0) {
    console.group('⚠️ Warnings');
    validation.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  if (validation.isValid) {
    console.log('✅ Environment configuration is valid');
  }
  
  console.groupEnd();
};

// Auto-validate in development
if (config.isDevelopment) {
  logEnvironmentInfo();
}

export default { validateEnvironment, logEnvironmentInfo };
