import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config 은 Node 에서 실행되지만 @types/node 미설치 → process 타입만 선언
declare const process: { env: Record<string, string | undefined> }

// 기본 base 는 '/' (로컬 서버 npm run start = localhost:8080 용).
// GitHub Pages 는 https://<user>.github.io/<repo>/ 하위경로라, Pages 배포(GitHub Actions)에서만
// GHP_BASE=/ywca-call-helper/ 를 넣어 하위경로로 빌드한다.
const GHP_BASE = process.env.GHP_BASE || '/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? GHP_BASE : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // 개발 중 /api 요청을 백엔드(8080)로 프록시
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
}))
