import type { Course } from '../types'

/**
 * 수동 보강 데이터 — 사이트(djjob)에는 없는 정보를 직접 입력하는 곳.
 * 자동 동기화(npm run sync / 백엔드)는 이 파일을 건드리지 않으므로 여기 입력한 값은 보존된다.
 *
 * - COMMON: 모든 과정에 공통 적용 (예: 센터 공통 환불 규정)
 * - BY_COURSE: 과정 ID별 개별 값. COMMON 을 덮어쓴다.
 *
 * ※ 값을 채우는 방법: 아래 BY_COURSE 에 해당 과정 id(courses.ts 의 c1, c2 …)를 키로 추가.
 *   과정은 회차마다 id 가 바뀔 수 있으니, 내용이 고정적이면 COMMON 사용을 권장.
 */
export interface CourseSupplement {
  curriculum?: string
  materials?: string
  refundPolicy?: string
}

/** 모든 과정 공통값 (센터 표준) */
export const COMMON_SUPPLEMENT: CourseSupplement = {
  // 국비지원 과정과 자비부담 과정의 환불 기준이 다르므로 안내 문구는 담당자 확인 유도.
  refundPolicy:
    '개강 전 취소 시 전액 환불됩니다. 개강 후에는 수강 진행 일수를 기준으로 환불되며, ' +
    '국비지원(내일배움카드) 과정은 관련 규정이 별도 적용됩니다. 정확한 환불액은 담당자 확인 후 안내드립니다.',
}

/** 과정 ID별 개별 보강값 (실제 내용 받으면 여기에 추가) */
export const BY_COURSE: Record<string, CourseSupplement> = {
  // 예시 (실제 값 받으면 주석 해제/수정):
  // c9: {
  //   curriculum: '커피 이론, 에스프레소 추출, 우유 스티밍, 라떼아트, 위생·서비스 실무',
  //   materials: '앞치마, 필기구 (원두·부자재는 센터 제공)',
  // },
}

/** 과정 하나에 보강값 병합 (BY_COURSE > COMMON > 기존 course 값) */
export function applySupplement(course: Course): Course {
  const extra = BY_COURSE[course.id] ?? {}
  const merged: Course = { ...course }
  const pick = (k: keyof CourseSupplement) =>
    extra[k] ?? course[k] ?? COMMON_SUPPLEMENT[k]

  const curriculum = pick('curriculum')
  const materials = pick('materials')
  const refundPolicy = pick('refundPolicy')
  if (curriculum) merged.curriculum = curriculum
  if (materials) merged.materials = materials
  if (refundPolicy) merged.refundPolicy = refundPolicy
  return merged
}

/** 과정 배열 전체에 보강값 병합 */
export function applySupplements(courses: Course[]): Course[] {
  return courses.map(applySupplement)
}
