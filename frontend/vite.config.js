import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'admin.covit.site',
      '.covit.site',
      'localhost',
      '127.0.0.1',
    ],
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: [
      'admin.covit.site',
      '.covit.site',
      'localhost',
      '127.0.0.1',
    ],
  },
})

