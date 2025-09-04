import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    
    // Development server configuration
    server: {
      port: 5173,
      host: true,
      cors: true,
    },
    
    // Environment variables
    envPrefix: 'VITE_',
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    }
  }
})
