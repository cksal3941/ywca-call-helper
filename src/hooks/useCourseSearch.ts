import { useMemo } from 'react'
import type { Course, CourseStatus } from '../types'
import { getCourseStatus } from '../utils/status'
import { categoryOf } from '../utils/category'

/** 필터 값: 'all' 또는 특정 상태 */
export type StatusFilter = 'all' | CourseStatus

export interface CourseWithStatus extends Course {
  computedStatus: CourseStatus
}

/** 검색어 정규화: 공백 제거 + 소문자 */
function norm(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

/**
 * 과정 검색 훅.
 * - 검색어: 과정명 또는 분야명 부분일치
 * - 필터: 상태별
 * 결과는 상태가 계산된 CourseWithStatus 배열.
 */
export function useCourseSearch(
  courses: Course[],
  query: string,
  filter: StatusFilter,
): CourseWithStatus[] {
  return useMemo(() => {
    const q = norm(query)

    const withStatus: CourseWithStatus[] = courses.map((c) => ({
      ...c,
      computedStatus: getCourseStatus(c),
    }))

    return withStatus.filter((c) => {
      // 상태 필터
      if (filter !== 'all' && c.computedStatus !== filter) return false
      // 검색어 (과정명 또는 분야명 부분일치)
      if (q) {
        const hay = norm(c.name + categoryOf(c))
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [courses, query, filter])
}
