import type { Course, CourseStatus } from '../types'

/** 오늘 날짜를 YYYY-MM-DD 로 반환 (로컬 기준) */
export function todayStr(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 과정 상태 계산.
 * 수동 지정(status)이 있으면 그대로 사용하고, 없으면 날짜로 자동 판정.
 * 우선순위: 종료 > 교육중 > (개강예정 / 모집중 / 모집마감)
 */
export function getCourseStatus(course: Course, today: string = todayStr()): CourseStatus {
  if (course.status) return course.status

  if (today > course.eduEnd) return '종료'
  if (today >= course.eduStart && today <= course.eduEnd) return '교육중'

  // 아직 개강 전
  if (today < course.recruitStart) return '개강예정'
  if (today <= course.recruitEnd) return '모집중'
  return '모집마감'
}

/** 오늘 개강하는 과정인가 */
export function isStartingToday(course: Course, today: string = todayStr()): boolean {
  return course.eduStart === today
}

/** 오늘 종료하는 과정인가 */
export function isEndingToday(course: Course, today: string = todayStr()): boolean {
  return course.eduEnd === today
}

/** 오늘 모집 마감하는 과정인가 */
export function isRecruitClosingToday(course: Course, today: string = todayStr()): boolean {
  return course.recruitEnd === today
}

/** 상태별 뱃지 색상 클래스 접미사 */
export function statusClass(status: CourseStatus): string {
  switch (status) {
    case '모집중':
      return 'recruiting'
    case '개강예정':
      return 'upcoming'
    case '모집마감':
      return 'closed'
    case '교육중':
      return 'ongoing'
    case '종료':
      return 'ended'
  }
}
