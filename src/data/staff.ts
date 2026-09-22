import type { Staff } from '../types'

/**
 * 담당자 데이터 — 대전여성인력개발센터 과정 분류(사이트 카테고리) 기준 그룹.
 *
 * ⚠ djjob.or.kr 사이트에는 과정별 "담당 직원 이름/내선번호"가 공개되어 있지 않습니다.
 *   아래 name/ext 는 placeholder("확인 필요")이며, 실제 담당자명·내선번호를 받으면 교체해야 합니다.
 *   courseIds 는 실제 과정 분류에 맞춰 매핑되어 있습니다.
 */
export const STAFF: Staff[] = [
  {
    id: 'st_job',
    name: '(담당자 확인 필요)',
    dept: '취업교육',
    role: '취업교육 과정',
    ext: '확인 필요',
    courseIds: ['c1', 'c7', 'c26'],
  },
  {
    id: 'st_edu',
    name: '(담당자 확인 필요)',
    dept: '교육서비스',
    role: '교육서비스 과정(바리스타·헤어·요양보호 등)',
    ext: '확인 필요',
    courseIds: ['c2', 'c8', 'c9', 'c13', 'c17', 'c22'],
  },
  {
    id: 'st_it',
    name: '(담당자 확인 필요)',
    dept: '사무관리·IT',
    role: '컴퓨터·SNS마케팅·OA 과정',
    ext: '확인 필요',
    courseIds: ['c3', 'c6', 'c12', 'c15', 'c18', 'c27'],
  },
  {
    id: 'st_cook',
    name: '(담당자 확인 필요)',
    dept: '조리·제빵',
    role: '조리·제빵 실습 과정',
    ext: '확인 필요',
    courseIds: ['c5', 'c11', 'c14', 'c16', 'c20', 'c21', 'c24', 'c25', 'c28', 'c29'],
  },
  {
    id: 'st_care',
    name: '(담당자 확인 필요)',
    dept: '보건복지서비스',
    role: '요양보호 등 보건복지 과정',
    ext: '확인 필요',
    courseIds: ['c19'],
  },
  {
    id: 'st_etc',
    name: '(담당자 확인 필요)',
    dept: '기타',
    role: '독서미술지도사·1일특강 등',
    ext: '확인 필요',
    courseIds: ['c4', 'c10', 'c23'],
  },
]

/** id → Staff 빠른 조회 맵 */
export const STAFF_BY_ID: Record<string, Staff> = Object.fromEntries(
  STAFF.map((s) => [s.id, s]),
)
