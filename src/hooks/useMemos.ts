import { useCallback, useEffect, useRef, useState } from 'react'
import type { CallMemo, CallStatus } from '../types'
import {
  fetchMemos,
  createMemo,
  pushMemos,
  patchMemoStatus,
  removeMemo,
} from '../api/memos'
import { purgeOldMemos } from '../utils/retention'

const LOCAL_KEY = 'ywca_memos' // localStorage 저장 키(로컬 모드 + 서버모드 이관 원본)

/** 저장 모드: 백엔드 사용 / 브라우저(localStorage)만 사용(GitHub Pages 등 서버 없음) */
type Mode = 'server' | 'local'

export interface MemosState {
  memos: CallMemo[]
  loading: boolean
  /** 서버 모드에서 통신 실패 시 메시지 (로컬 모드에선 항상 null) */
  error: string | null
  /** 저장 방식 표시용 */
  mode: Mode
  add: (memo: CallMemo) => Promise<{ ok: boolean; message?: string }>
  updateStatus: (id: string, status: CallStatus) => Promise<void>
  remove: (id: string) => Promise<void>
}

function readLocal(): CallMemo[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const list = raw ? (JSON.parse(raw) as CallMemo[]) : []
    return Array.isArray(list) ? purgeOldMemos(list) : []
  } catch {
    return []
  }
}

function writeLocal(memos: CallMemo[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(memos))
  } catch {
    /* 용량 초과 등 무시 */
  }
}

/** 이전 localStorage 메모를 서버로 1회 올린다(서버 모드에서만). */
async function migrateLegacy(): Promise<CallMemo[] | null> {
  const legacy = readLocal()
  if (legacy.length === 0) return null
  const merged = await pushMemos(legacy)
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    /* 무시 */
  }
  return merged
}

/**
 * 전화응대 메모 훅.
 * - 백엔드(/api/memos)가 있으면 서버에 저장(여러 PC 공유·아카이브).
 * - 백엔드가 없으면(GitHub Pages 등) 자동으로 이 브라우저 localStorage 에 저장.
 */
export function useMemos(): MemosState {
  const [memos, setMemos] = useState<CallMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('server')
  const modeRef = useRef<Mode>('server')
  const setModeBoth = (m: Mode) => {
    modeRef.current = m
    setMode(m)
  }

  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const migrated = await migrateLegacy()
        setMemos(migrated ?? (await fetchMemos(ctrl.signal)))
        setModeBoth('server')
        setError(null)
      } catch {
        // 서버 없음/불가 → 브라우저 저장 모드 (오프라인 배포에서도 메모 사용 가능)
        setModeBoth('local')
        setMemos(readLocal())
        setError(null)
      } finally {
        setLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [])

  const add = useCallback(async (memo: CallMemo) => {
    if (modeRef.current === 'local') {
      setMemos((prev) => {
        const next = [memo, ...prev]
        writeLocal(next)
        return next
      })
      return { ok: true }
    }
    // 서버 모드: 낙관적 반영 후 API
    setMemos((prev) => [memo, ...prev])
    try {
      const saved = await createMemo(memo)
      setMemos((prev) => prev.map((m) => (m.id === memo.id ? saved : m)))
      setError(null)
      return { ok: true }
    } catch (e) {
      setMemos((prev) => prev.filter((m) => m.id !== memo.id))
      const message = e instanceof Error ? e.message : '저장 실패'
      setError(message)
      return { ok: false, message }
    }
  }, [])

  const updateStatus = useCallback(async (id: string, status: CallStatus) => {
    if (modeRef.current === 'local') {
      setMemos((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, status } : m))
        writeLocal(next)
        return next
      })
      return
    }
    const prevMemos = memos
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
    try {
      await patchMemoStatus(id, status)
      setError(null)
    } catch (e) {
      setMemos(prevMemos)
      setError(e instanceof Error ? e.message : '상태 변경 실패')
    }
  }, [memos])

  const remove = useCallback(async (id: string) => {
    if (modeRef.current === 'local') {
      setMemos((prev) => {
        const next = prev.filter((m) => m.id !== id)
        writeLocal(next)
        return next
      })
      return
    }
    const prevMemos = memos
    setMemos((prev) => prev.filter((m) => m.id !== id))
    try {
      await removeMemo(id)
      setError(null)
    } catch (e) {
      setMemos(prevMemos)
      setError(e instanceof Error ? e.message : '삭제 실패')
    }
  }, [memos])

  return { memos, loading, error, mode, add, updateStatus, remove }
}
