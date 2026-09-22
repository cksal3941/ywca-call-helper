import type { Course } from '../types'
import { STAFF_BY_ID } from '../data/staff'

/** 분야 표시 순서 (전화 문의가 잦은 순으로 우선 배치) */
export const CATEGORY_ORDER = [
  '사무관리·IT',
  '조리·제빵',
  '교육서비스',
  '취업교육',
  '보건복지서비스',
  '기타',
]

/** 과정의 분야(담당 부서 기준) */
export function categoryOf(course: Course): string {
  return STAFF_BY_ID[course.staffId]?.dept ?? '기타'
}

export interface CategoryGroup<T extends Course = Course> {
  category: string
  courses: T[]
}

/**
 * 과정 배열을 분야별로 묶는다. CATEGORY_ORDER 순서 유지, 빈 분야는 제외.
 * order 목록에 없는 분야는 맨 뒤에 추가.
 */
export function groupByCategory<T extends Course>(courses: T[]): CategoryGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const c of courses) {
    const cat = categoryOf(c)
    const arr = map.get(cat)
    if (arr) arr.push(c)
    else map.set(cat, [c])
  }
  const ordered: CategoryGroup<T>[] = []
  for (const cat of CATEGORY_ORDER) {
    const arr = map.get(cat)
    if (arr && arr.length) {
      ordered.push({ category: cat, courses: arr })
      map.delete(cat)
    }
  }
  // 순서 목록에 없던 분야
  for (const [category, arr] of map) ordered.push({ category, courses: arr })
  return ordered
}
