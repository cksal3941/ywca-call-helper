import type { CallMemo, CallStatus } from '../types'

/** 서버에서 전체 메모를 가져온다. */
export async function fetchMemos(signal?: AbortSignal): Promise<CallMemo[]> {
  const res = await fetch('/api/memos', { signal })
  if (!res.ok) throw new Error(`/api/memos ${res.status}`)
  const data = (await res.json()) as { memos: CallMemo[] }
  return Array.isArray(data.memos) ? data.memos : []
}

/** 메모 저장. 서버가 저장한 메모(정규화본)를 반환. */
export async function createMemo(memo: CallMemo): Promise<CallMemo> {
  const res = await fetch('/api/memos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memo),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `저장 실패 (${res.status})`)
  }
  const data = (await res.json()) as { memo: CallMemo }
  return data.memo
}

/** 여러 메모 일괄 병합(로컬 → 서버 1회 마이그레이션). 병합 후 전체 목록 반환. */
export async function pushMemos(memos: CallMemo[]): Promise<CallMemo[]> {
  const res = await fetch('/api/memos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memos }),
  })
  if (!res.ok) throw new Error(`마이그레이션 실패 (${res.status})`)
  const data = (await res.json()) as { memos: CallMemo[] }
  return Array.isArray(data.memos) ? data.memos : []
}

/** 처리 상태 변경. */
export async function patchMemoStatus(id: string, status: CallStatus): Promise<void> {
  const res = await fetch(`/api/memos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(`상태 변경 실패 (${res.status})`)
}

/** 메모 삭제. */
export async function removeMemo(id: string): Promise<void> {
  const res = await fetch(`/api/memos/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`삭제 실패 (${res.status})`)
}
