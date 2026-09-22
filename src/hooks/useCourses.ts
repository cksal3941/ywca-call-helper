import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Course } from '../types'
import { COURSES as RAW_FALLBACK } from '../data/courses'
import { applySupplements } from '../data/supplements'
import { fetchCourses, refreshCourses } from '../api/courses'

const FALLBACK = applySupplements(RAW_FALLBACK)

export interface CoursesState {
  courses: Course[]
  byId: Record<string, Course>
  updatedAt: string | null
  stale: boolean
  /** 'server': 백엔드 데이터 / 'fallback': 번들 스냅샷 */
  source: 'server' | 'fallback'
  loading: boolean
  refreshing: boolean
  /** 즉시 갱신(POST /api/refresh). 성공 여부 반환 */
  refresh: () => Promise<{ ok: boolean; message?: string }>
}

/**
 * 교육과정 데이터 소스 훅.
 * 앱 시작 시 백엔드(/api/courses) 시도 → 실패하면 번들 스냅샷으로 폴백.
 */
export function useCourses(): CoursesState {
  const [courses, setCourses] = useState<Course[]>(FALLBACK)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const [source, setSource] = useState<'server' | 'fallback'>('fallback')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500) // 2.5s 내 응답 없으면 폴백
    ;(async () => {
      try {
        const data = await fetchCourses(ctrl.signal)
        setCourses(applySupplements(data.courses))
        setUpdatedAt(data.updatedAt)
        setStale(data.stale)
        setSource('server')
      } catch {
        setSource('fallback') // 번들 스냅샷 유지
      } finally {
        clearTimeout(timer)
        setLoading(false)
      }
    })()
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await refreshCourses()
      setCourses(applySupplements(data.courses))
      setUpdatedAt(data.updatedAt)
      setStale(data.stale)
      setSource('server')
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : '갱신 실패' }
    } finally {
      setRefreshing(false)
    }
  }, [])

  const byId = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])) as Record<string, Course>,
    [courses],
  )

  return { courses, byId, updatedAt, stale, source, loading, refreshing, refresh }
}
