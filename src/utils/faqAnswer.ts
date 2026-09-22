import type { Course, FaqItem } from '../types'
import { STAFF_BY_ID } from '../data/staff'
import { getCourseStatus } from './status'
import { formatFee, formatPeriod, formatDate } from './format'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' → 요일 (로컬 기준) */
function dowOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return DOW[new Date(y, m - 1, d).getDay()]
}

/**
 * FAQ 답변 생성.
 * 과정이 선택돼 있으면 template 의 placeholder 를 과정 정보로 치환,
 * 없으면 fallback 문구 반환.
 */
export function buildFaqAnswer(faq: FaqItem, course: Course | null): string {
  if (!course) return faq.fallback

  const staff = STAFF_BY_ID[course.staffId]
  const map: Record<string, string> = {
    name: course.name,
    fee: formatFee(course.fee),
    subsidized: course.isSubsidized ? '가능' : '해당 없음',
    eduPeriod: formatPeriod(course.eduStart, course.eduEnd),
    recruitPeriod: formatPeriod(course.recruitStart, course.recruitEnd),
    openDate: `${formatDate(course.eduStart)}(${dowOf(course.eduStart)})`,
    days: course.days,
    time: course.time,
    room: course.room,
    applyMethod: course.applyMethod,
    condition: course.applyCondition,
    documents: course.documents,
    status: getCourseStatus(course),
    staff: staff ? staff.name : '담당자',
    dept: staff ? staff.dept : '',
    ext: staff ? staff.ext : '',
    // 수동 보강 필드 — 값이 없으면 담당자 확인 유도 문구
    curriculum: course.curriculum || '세부 교육내용은 담당자 확인 후 정확히 안내드리겠습니다',
    materials: course.materials || '준비물은 담당자 확인 후 안내드리겠습니다',
    refundPolicy: course.refundPolicy || '환불 규정은 담당자 확인이 필요합니다',
  }

  return faq.template.replace(/\{(\w+)\}/g, (_, key) =>
    key in map ? map[key] : `{${key}}`,
  )
}
