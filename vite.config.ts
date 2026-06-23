import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // All requests to /api/mcp are forwarded to the Kapruka MCP endpoint.
      // This avoids CORS errors during local development.
      '/api/mcp': {
        target: 'https://mcp.kapruka.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/mcp/, '/mcp'),
      },
    },
  },
})
