# Environment Configuration

This project uses environment variables to configure the connection between frontend and backend.

## Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in `.env`:**
   ```env
   # Backend API Configuration
   VITE_API_BASE_URL=http://localhost:5001
   VITE_SOCKET_URL=http://localhost:5001
   
   # Environment
   VITE_NODE_ENV=development
   ```

## Environment Variables

### Required Variables

- `VITE_API_BASE_URL`: The base URL for your backend API (e.g., `http://localhost:5001`)
- `VITE_SOCKET_URL`: The URL for WebSocket connections (e.g., `http://localhost:5001`)

### Optional Variables

- `VITE_NODE_ENV`: Environment mode (`development` or `production`)

## Environment Files

- `.env` - Default environment variables
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables
- `.env.example` - Example template

## Usage in Code

The environment variables are accessed through the `config` object:

```javascript
import config from './config/env.js';

// Access API URL
const apiUrl = config.apiUrl;

// Access socket URL
const socketUrl = config.socketUrl;

// Check environment
if (config.isDevelopment) {
  // Development-specific code
}
```

## Important Notes

1. **Variable Prefix**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

2. **Security**: Never commit sensitive data in environment files. Add `.env` to `.gitignore`.

3. **Build Time**: Environment variables are replaced at build time, not runtime.

4. **Development vs Production**: 
   - Development: Use `http://localhost:5001`
   - Production: Use your deployed backend URL

## Troubleshooting

1. **Variables not loading**: Ensure they are prefixed with `VITE_`
2. **Connection errors**: Check that `VITE_API_BASE_URL` matches your backend server
3. **Socket issues**: Verify `VITE_SOCKET_URL` is correct and accessible
