import type { Course } from '../types'

export interface CoursesResponse {
  updatedAt: string | null
  count: number
  stale: boolean
  courses: Course[]
}

/** 백엔드에서 최신 교육과정을 가져온다. 실패 시 throw (호출부에서 폴백 처리). */
export async function fetchCourses(signal?: AbortSignal): Promise<CoursesResponse> {
  const res = await fetch('/api/courses', { signal })
  if (!res.ok) throw new Error(`/api/courses ${res.status}`)
  const data = (await res.json()) as CoursesResponse
  if (!Array.isArray(data.courses) || data.courses.length === 0) {
    throw new Error('빈 응답')
  }
  return data
}

/** 즉시 재크롤 요청. 성공 시 최신 데이터 반환. */
export async function refreshCourses(): Promise<CoursesResponse> {
  const res = await fetch('/api/refresh', { method: 'POST' })
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || '잠시 후 다시 시도해 주세요.')
  }
  if (!res.ok) throw new Error(`갱신 실패 (${res.status})`)
  return (await res.json()) as CoursesResponse
}
