// 교육과정 캐시 스토어 — 메모리 + 디스크(data/courses.json) 이중 보관.
// 마지막 성공 크롤 결과를 보관해 사이트 장애 시에도 제공한다.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const CACHE_FILE = join(DATA_DIR, 'courses.json')

/** @type {{ updatedAt: string|null, courses: any[], lastError: string|null }} */
let cache = { updatedAt: null, courses: [], lastError: null }

/** 부팅 시 디스크 캐시 로드 (있으면) */
export async function loadFromDisk() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.courses)) {
      cache = { updatedAt: parsed.updatedAt ?? null, courses: parsed.courses, lastError: null }
    }
  } catch {
    /* 캐시 파일 없음 → 무시 (첫 크롤이 채움) */
  }
  return cache
}

/** 크롤 성공 결과 저장 (메모리 + 디스크) */
export async function setCourses(courses, updatedAt) {
  cache = { updatedAt, courses, lastError: null }
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify({ updatedAt, courses }, null, 2), 'utf8')
  } catch (e) {
    console.error('캐시 디스크 저장 실패:', e.message)
  }
}

/** 크롤 실패 기록 (기존 캐시는 유지) */
export function setError(message) {
  cache.lastError = message
}

export function getCache() {
  return cache
}

/** 마지막 갱신 후 경과(분) */
export function ageMinutes() {
  if (!cache.updatedAt) return null
  return Math.round((Date.now() - new Date(cache.updatedAt).getTime()) / 60000)
}
