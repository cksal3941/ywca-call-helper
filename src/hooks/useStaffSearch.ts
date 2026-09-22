import { useMemo } from 'react'
import type { Course, Staff } from '../types'
import { STAFF } from '../data/staff'

export interface StaffWithCourses extends Staff {
  courses: { id: string; name: string }[]
}

function norm(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

/**
 * 담당자 검색 (기획서 9장).
 * 담당자 이름 또는 담당 과정명 부분일치로 검색.
 * 검색어가 없으면 빈 배열(담당자 결과 미표시).
 */
export function useStaffSearch(
  byId: Record<string, Course>,
  query: string,
): StaffWithCourses[] {
  return useMemo(() => {
    const q = norm(query)
    if (!q) return []

    return STAFF.map((s) => {
      const courses = s.courseIds
        .map((id) => byId[id])
        .filter(Boolean)
        .map((c) => ({ id: c.id, name: c.name }))
      return { ...s, courses }
    }).filter((s) => {
      const nameHit = norm(s.name).includes(q)
      const courseHit = s.courses.some((c) => norm(c.name).includes(q))
      return nameHit || courseHit
    })
  }, [byId, query])
}
