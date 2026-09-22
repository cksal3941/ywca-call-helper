// 대전여성인력개발센터(djjob.or.kr) 교육과정 동기화 (CLI)
// 사용법:  npm run sync
// scraper 모듈로 크롤한 결과를 src/data/courses.ts (빌드 폴백 스냅샷)로 다시 생성한다.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { scrapeCourses, SOURCE_BASE } from '../server/scraper.mjs'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'courses.ts')

function render(courses) {
  const body = courses
    .map((c) => '  ' + JSON.stringify(c))
    .join(',\n')
    .replace(/"([a-zA-Z]\w*)":/g, '$1:') // JSON key 따옴표 제거 → TS 스타일
  const today = new Date().toISOString().slice(0, 10)
  return `import type { Course } from '../types'

/**
 * 대전여성인력개발센터(djjob.or.kr) 실제 교육과정 데이터 (빌드 폴백 스냅샷).
 * 출처: ${SOURCE_BASE}/sub1/sub1.aspx  (자동 동기화: npm run sync)
 * 마지막 동기화: ${today} · 총 ${courses.length}개 과정
 *
 * 런타임에는 백엔드(/api/courses)가 최신값을 제공하고, 서버 불가 시 이 스냅샷으로 폴백한다.
 * capacity=모집정원, enrolled=현재 신청인원. fee=수강료(자비부담금), isSubsidized=국비지원 여부.
 * ⚠ 담당자/부서/내선(staff.ts), 신청조건/준비서류는 사이트에 없어 placeholder("확인 필요").
 */
export const COURSES: Course[] = [
${body},
]

/** id → Course 빠른 조회 맵 */
export const COURSE_BY_ID: Record<string, Course> = Object.fromEntries(
  COURSES.map((c) => [c.id, c]),
)
`
}

async function main() {
  const courses = await scrapeCourses()
  await writeFile(OUT, render(courses), 'utf8')
  console.log(`✓ ${courses.length}개 과정 동기화 완료 → src/data/courses.ts`)
  console.log(
    '  신청/정원 예시:',
    courses.slice(0, 3).map((c) => `${c.name.slice(0, 12)}… ${c.enrolled}/${c.capacity}`).join(' | '),
  )
}

main().catch((e) => {
  console.error('동기화 실패:', e.message)
  process.exit(1)
})
