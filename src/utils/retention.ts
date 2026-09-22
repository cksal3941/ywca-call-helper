import type { CallMemo } from '../types'

/** 전화 메모 보관 기간(일). 이후 자동 삭제 (기획서 15장 개인정보 보호) */
export const RETENTION_DAYS = 90

/**
 * 보관기간이 지난 메모를 걸러낸다.
 * createdAt 이 (오늘 - RETENTION_DAYS) 보다 오래된 항목 제거.
 */
export function purgeOldMemos(
  memos: CallMemo[],
  now: Date = new Date(),
): CallMemo[] {
  const cutoff = now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  return memos.filter((m) => {
    const t = new Date(m.createdAt).getTime()
    // 파싱 불가한 값은 보존 (데이터 유실 방지)
    return isNaN(t) || t >= cutoff
  })
}
