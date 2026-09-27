// 교육과정 캐시 스토어 — 메모리 + 디스크(data/courses.json) 이중 보관.
// 마지막 성공 크롤 결과를 보관해 사이트 장애 시에도 제공한다.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const CACHE_FILE = join(DATA_DIR, 'courses.json')

// 사이트에서 사라진 '종료 보관' 과정을 얼마나 오래 유지할지 (교육종료 기준 경과일)
const ARCHIVE_RETENTION_DAYS = Number(process.env.ARCHIVE_RETENTION_DAYS) || 365

/** 보관 과정 정리: 교육종료가 너무 오래 지난 것은 제거해 목록 팽창 방지 */
function pruneArchived(list) {
  const cutoff = Date.now() - ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  return list.filter((c) => {
    const t = new Date(c.eduEnd).getTime()
    return isNaN(t) || t >= cutoff
  })
}

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

/**
 * 크롤 성공 결과 저장 (메모리 + 디스크).
 * 이전 캐시에 있었으나 이번 크롤에서 사라진 과정은 '종료 보관(archived)'으로 유지한다.
 * (상담 시 지난 과정도 조회 가능하도록. 단 오래된 보관 과정은 정리)
 */
export async function setCourses(courses, updatedAt) {
  const prevById = new Map((cache.courses || []).map((c) => [c.id, c]))
  const newIds = new Set(courses.map((c) => c.id))

  // 이번 크롤에 이전 과정이 하나도 안 겹치면 ID 체계 변경/초기화로 간주 → 보관 생략
  const overlap = courses.some((c) => prevById.has(c.id))

  let archived = []
  if (prevById.size > 0 && overlap) {
    for (const [id, old] of prevById) {
      if (newIds.has(id)) continue // 여전히 사이트에 있음
      // 사라진 과정 → 종료 보관 (이미 보관 중이면 그대로 유지)
      archived.push({ ...old, archived: true, status: '종료' })
    }
    archived = pruneArchived(archived)
  }

  const merged = [...courses, ...archived]
  cache = { updatedAt, courses: merged, lastError: null }
  if (archived.length) {
    console.log(`[store] 종료 보관 과정 ${archived.length}건 유지 (사이트에서 사라짐)`)
  }
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify({ updatedAt, courses: merged }, null, 2), 'utf8')
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
