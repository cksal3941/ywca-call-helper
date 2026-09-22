import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // 개발 중 /api 요청을 백엔드(8080)로 프록시
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
