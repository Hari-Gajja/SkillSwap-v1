// Environment configuration
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001',
  
  // Environment
  nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  // API Endpoints
  get apiUrl() {
    return `${this.apiBaseUrl}/api`;
  },
  
  // Get full endpoint URL
  getEndpoint: (path) => {
    const baseUrl = config.apiBaseUrl;
    const apiPath = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
    return `${baseUrl}${apiPath}`;
  }
};

// Validate required environment variables
const requiredEnvVars = ['VITE_API_BASE_URL', 'VITE_SOCKET_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

if (missingEnvVars.length > 0 && config.isDevelopment) {
  console.warn('Missing environment variables:', missingEnvVars);
  console.warn('Using fallback values. Consider creating a .env file with proper values.');
}

export default config;
