// 전화응대 메모 스토어 — 메모리 + 디스크(data/memos.json) 보관.
// 개인정보(전화메모)를 서버에 저장해 여러 PC에서 공유/백업할 수 있게 한다.
// 보관기간(90일)이 지난 메모는 로드/쓰기 시 자동 정리한다 (기획서 15장).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const MEMOS_FILE = join(DATA_DIR, 'memos.json')

export const RETENTION_DAYS = 90
const STATUSES = ['안내완료', '담당자연결', '담당자전달', '재연락필요']

/** @type {any[]} */
let memos = []

/** 보관기간이 지난 메모 제거 (파싱 불가 값은 보존) */
function purge(list) {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  return list.filter((m) => {
    const t = new Date(m.createdAt).getTime()
    return isNaN(t) || t >= cutoff
  })
}

async function persist() {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(MEMOS_FILE, JSON.stringify(memos, null, 2), 'utf8')
  } catch (e) {
    console.error('메모 디스크 저장 실패:', e.message)
  }
}

/** 부팅 시 디스크에서 로드 (있으면) + 만료 정리 */
export async function loadMemos() {
  try {
    const raw = await readFile(MEMOS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const cleaned = purge(parsed)
      memos = cleaned
      if (cleaned.length !== parsed.length) await persist()
    }
  } catch {
    /* 파일 없음 → 빈 목록으로 시작 */
  }
  return memos
}

/** 최신순 정렬된 메모 목록 반환 (만료분 제외) */
export function getMemos() {
  memos = purge(memos)
  return memos
}

/** 들어온 메모 데이터를 검증/정규화 (문자열 필드만 허용) */
function normalize(input, fallbackId) {
  const str = (v) => (typeof v === 'string' ? v : '')
  const status = STATUSES.includes(input.status) ? input.status : '안내완료'
  return {
    id: str(input.id) || fallbackId,
    createdAt: str(input.createdAt) || new Date().toISOString(),
    callerName: str(input.callerName),
    phone: str(input.phone),
    courseName: str(input.courseName),
    content: str(input.content),
    checkItem: str(input.checkItem),
    memo: str(input.memo),
    status,
  }
}

/** 메모 추가 (맨 앞에). 저장된 메모 반환 */
export async function addMemo(input) {
  const id = (typeof input.id === 'string' && input.id) || `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const memo = normalize(input, id)
  memos = [memo, ...purge(memos).filter((m) => m.id !== memo.id)]
  await persist()
  return memo
}

/** 여러 메모를 한 번에 병합(마이그레이션용). 기존 id는 유지, 중복 id는 무시 */
export async function mergeMemos(list) {
  if (!Array.isArray(list) || list.length === 0) return memos
  const existing = new Set(memos.map((m) => m.id))
  const incoming = list
    .map((m) => normalize(m, `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`))
    .filter((m) => !existing.has(m.id))
  memos = purge([...incoming, ...memos])
  // createdAt 최신순 정렬
  memos.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  await persist()
  return memos
}

/** 상태 변경. 변경된 메모 반환(없으면 null) */
export async function updateMemoStatus(id, status) {
  if (!STATUSES.includes(status)) return null
  let updated = null
  memos = memos.map((m) => {
    if (m.id === id) {
      updated = { ...m, status }
      return updated
    }
    return m
  })
  if (updated) await persist()
  return updated
}

/** 삭제. 삭제 여부 반환 */
export async function deleteMemo(id) {
  const before = memos.length
  memos = memos.filter((m) => m.id !== id)
  const removed = memos.length !== before
  if (removed) await persist()
  return removed
}
