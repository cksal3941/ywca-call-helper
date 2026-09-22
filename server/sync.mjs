// 동기화 실행기 — scrapeCourses() 를 호출해 캐시에 반영. 동시 실행 방지 락 포함.

import { scrapeCourses } from './scraper.mjs'
import { setCourses, setError, getCache } from './store.mjs'

let inFlight = null
let lastRunAt = 0

/** 마지막 동기화 시도 시각(ms) — rate-limit 판단용 */
export function lastAttemptAt() {
  return lastRunAt
}

/**
 * 동기화 1회 실행.
 * 성공: 캐시 교체. 실패: 기존 캐시 유지 + lastError 기록.
 * 이미 실행 중이면 그 Promise 를 공유(중복 크롤 방지).
 */
export function runSync(reason = 'manual') {
  if (inFlight) return inFlight
  lastRunAt = Date.now()
  inFlight = (async () => {
    try {
      const courses = await scrapeCourses()
      const updatedAt = new Date().toISOString()
      await setCourses(courses, updatedAt)
      console.log(`[sync:${reason}] ✓ ${courses.length}개 과정 갱신 (${updatedAt})`)
      return { ok: true, count: courses.length, updatedAt }
    } catch (e) {
      setError(e.message)
      const had = getCache().courses.length
      console.error(`[sync:${reason}] ✗ 실패: ${e.message} (기존 캐시 ${had}개 유지)`)
      return { ok: false, error: e.message }
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
