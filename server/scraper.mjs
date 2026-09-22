// 교육과정 스크래퍼 — CLI(npm run sync)와 백엔드 서버가 공유하는 단일 소스.
// djjob.or.kr 6개 페이지를 읽어 Course[] 를 반환한다. (파일 쓰기/렌더링은 호출부 담당)

export const SOURCE_BASE = process.env.SOURCE_BASE || 'https://www.djjob.or.kr'

const CAT_STAFF = {
  '취업교육': 'st_job',
  '교육서비스': 'st_edu',
  '사무관리,IT관련': 'st_it',
  '조리,제빵': 'st_cook',
  '보건복지서비스': 'st_care',
  '기타': 'st_etc',
}

const num = (s) => parseInt(String(s || '').replace(/[^\d]/g, '')) || 0
const cleanTime = (s) =>
  String(s || '').replace(/[∼～]/g, '~').replace(/\s*~\s*/, '~').replace(/\s+/g, ' ').trim()

/** HTML → 텍스트(태그 제거) */
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
}

/** 한 과정 카드 블록에서 필드 추출 (블록은 카드 하나만 포함 → 경계 문제 없음) */
function parseBlock(block) {
  const g = (re) => {
    const m = block.match(re)
    return m ? m[1].trim() : ''
  }
  if (!/교육기간 :/.test(block) || !/수강료 :/.test(block)) return null
  const name = g(/\[[^\]]+\]\s*([^\n]+)/)
  const eduP = g(/교육기간 :\s*([\d-]+ ~ [\d-]+)/).split(' ~ ')
  const recruitP = g(/모집기간 :\s*([\d-]+ ~ [\d-]+)/).split(' ~ ')
  const enroll = g(/모집인원:\s*(\d+\/\d+)명/).split('/')
  if (!name || eduP.length < 2) return null
  return {
    category: g(/\[([^\]]+)\]/),
    name,
    eduStart: eduP[0],
    eduEnd: eduP[1],
    eduDetail: g(/교육기간 :[^(]*\(([^)]+)\)/),
    days: g(/요일 :\s*([^|]+)\|/).replace('매주', '').trim(),
    time: cleanTime(g(/시간 :\s*([^\n]+?)\s*(?:모집인원|$)/)),
    enrolled: num(enroll[0]),
    capacity: num(enroll[1]),
    room: g(/강의실 :\s*([^|\n]*)/),
    teacher: g(/강사 :[ \t]*([^\n|]*)/),
    fee: num(g(/수강료 :\s*([\d,]+)원/)),
    subsidy: num(g(/국비지원\s*([\d,]+)원/)),
    recruitStart: recruitP[0] || '',
    recruitEnd: recruitP[1] || '',
  }
}

function parseText(text) {
  // 각 카드는 "…(추가모집시 연장될 수 있음)" 으로 끝난다. 이를 구분자로 블록 분리.
  return text
    .split(/추가모집시 연장될 수 있음/)
    .map(parseBlock)
    .filter(Boolean)
}

/** raw 카드 → Course 객체(가공 규칙 적용) */
function toCourse(c, i) {
  const cleanName = c.name.replace(/★[^★]*★/g, '').trim()
  const notes = []
  if (c.name.includes('개강확정')) notes.push('개강확정')
  if (c.eduDetail) notes.push(c.eduDetail)
  if (c.teacher) notes.push('강사 ' + c.teacher)
  const status = /상시모집|연중/.test(c.name) ? '모집중' : undefined
  const subsidized = c.subsidy > 0 || (c.fee === 0 && /무료|국비|내일배움|뉴딜/.test(c.name))
  const course = {
    id: 'c' + (i + 1),
    name: cleanName,
    recruitStart: c.recruitStart,
    recruitEnd: c.recruitEnd,
    eduStart: c.eduStart,
    eduEnd: c.eduEnd,
    days: c.days,
    time: c.time,
    fee: c.fee,
    isSubsidized: subsidized,
    capacity: c.capacity,
    enrolled: c.enrolled,
    applyMethod: '전화 또는 방문 접수',
    applyCondition: '확인 필요',
    documents: '확인 필요',
    room: c.room,
    staffId: CAT_STAFF[c.category] || 'st_etc',
    note: notes.join(' · '),
  }
  if (status) course.status = status
  return course
}

/**
 * djjob.or.kr 6개 페이지를 크롤해 Course[] 반환.
 * 실패 시 throw (호출부에서 캐시 유지 등 처리).
 */
export async function scrapeCourses() {
  const raw = []
  for (let p = 0; p < 6; p++) {
    const url = `${SOURCE_BASE}/sub1/sub1.aspx?p=${p}&ename=&ct=&cwc=`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`fetch 실패 p=${p} status=${res.status}`)
    raw.push(...parseText(toText(await res.text())))
  }
  if (raw.length === 0) {
    throw new Error('과정을 하나도 파싱하지 못했습니다. 사이트 구조가 바뀌었을 수 있습니다.')
  }
  return raw.map(toCourse)
}
