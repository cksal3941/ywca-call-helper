// YWCA 전화응대 업무도우미 — 백엔드 서버
// 교육과정 자동/수동 동기화 + 정적 React 앱 서빙 (단일 오리진 → CORS 불필요)

import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { loadFromDisk, getCache, ageMinutes } from './store.mjs'
import { runSync, lastAttemptAt } from './sync.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

const PORT = Number(process.env.PORT) || 8080
const SYNC_INTERVAL_HOURS = Number(process.env.SYNC_INTERVAL_HOURS) || 6
const SYNC_ON_BOOT = (process.env.SYNC_ON_BOOT ?? 'true') !== 'false'
const REFRESH_MIN_INTERVAL_SEC = Number(process.env.REFRESH_MIN_INTERVAL_SEC) || 60

/** 데이터가 오래됐는지(장애/지연) 판단: 에러가 있거나 갱신 주기의 2배를 넘김 */
function isStale() {
  const c = getCache()
  if (c.lastError) return true
  const age = ageMinutes()
  return age != null && age > SYNC_INTERVAL_HOURS * 60 * 2
}

const app = express()

// ── API ─────────────────────────────────────────
app.get('/api/courses', (_req, res) => {
  const c = getCache()
  res.json({ updatedAt: c.updatedAt, count: c.courses.length, stale: isStale(), courses: c.courses })
})

app.post('/api/refresh', async (_req, res) => {
  const sinceLast = (Date.now() - lastAttemptAt()) / 1000
  if (sinceLast < REFRESH_MIN_INTERVAL_SEC) {
    return res.status(429).json({
      error: '잠시 후 다시 시도해 주세요.',
      retryAfterSec: Math.ceil(REFRESH_MIN_INTERVAL_SEC - sinceLast),
    })
  }
  const result = await runSync('refresh')
  const c = getCache()
  if (!result.ok) {
    return res.status(502).json({ error: result.error, updatedAt: c.updatedAt, courses: c.courses })
  }
  res.json({ updatedAt: c.updatedAt, count: c.courses.length, stale: isStale(), courses: c.courses })
})

app.get('/api/health', (_req, res) => {
  const c = getCache()
  res.json({
    ok: true,
    lastSync: c.updatedAt,
    lastError: c.lastError,
    ageMinutes: ageMinutes(),
    stale: isStale(),
    count: c.courses.length,
  })
})

// ── 정적 React 앱 (dist) + SPA 폴백 ────────────────
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')))
} else {
  console.warn('⚠ dist 폴더가 없습니다. `npm run build` 후 실행하면 앱도 함께 서빙됩니다.')
}

// ── 부팅 ────────────────────────────────────────
async function boot() {
  await loadFromDisk()
  const cached = getCache().courses.length
  if (cached) console.log(`디스크 캐시 로드: ${cached}개 과정 (${getCache().updatedAt})`)

  if (SYNC_ON_BOOT) runSync('boot')

  const intervalMs = SYNC_INTERVAL_HOURS * 60 * 60 * 1000
  setInterval(() => runSync('scheduled'), intervalMs)

  app.listen(PORT, () => {
    console.log(`YWCA 백엔드 실행: http://localhost:${PORT}`)
    console.log(`자동 동기화 주기: ${SYNC_INTERVAL_HOURS}시간 · 부팅 시 크롤: ${SYNC_ON_BOOT}`)
  })
}

boot()
