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

/**
 * djjob 과정 구분 탭 (전체과정=sub1 제외). 각 탭은 전체과정의 부분집합이며
 * 재원/대상(국민내일배움카드제=실업자·구직자, 근로자직무능력향상=재직자 등)을 구분한다.
 */
const CATEGORY_TABS = [
  { path: '/sub1/sub2.aspx', label: '아이돌봄' },
  { path: '/sub1/sub3.aspx', label: '국민내일배움카드제' },
  { path: '/sub1/sub4.aspx', label: '근로자직무능력향상' },
  { path: '/sub1/sub5.aspx', label: '취업교육' },
  { path: '/sub1/sub6.aspx', label: '사회문화' },
  { path: '/sub1/sub7.aspx', label: '기타' },
]

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

/** 리스트 HTML 에서 카드별 상세코드(cop=CO…)를 등장 순서대로 추출 (카드당 링크 2개 → 연속 중복 제거) */
function copCodes(html) {
  const codes = []
  for (const m of html.matchAll(/course_1\.aspx\?[^'"]*?cop=(CO\d+)/g)) {
    if (codes[codes.length - 1] !== m[1]) codes.push(m[1])
  }
  return codes
}

/** 한 탭의 모든 페이지를 돌며 소속 cop 집합 반환 (빈 페이지 나오면 조기 종료) */
async function fetchTabCops(path) {
  const set = new Set()
  for (let p = 0; p < 6; p++) {
    try {
      const res = await fetch(`${SOURCE_BASE}${path}?p=${p}&ename=&ct=&cwc=`)
      if (!res.ok) break
      const codes = copCodes(await res.text())
      if (codes.length === 0) break // 더 이상 카드 없음
      codes.forEach((c) => set.add(c))
    } catch {
      break
    }
  }
  return set
}

/** 모든 구분 탭을 병렬로 크롤해 { label: Set<cop> } 반환 */
async function fetchTabMemberships() {
  const entries = await mapPool(CATEGORY_TABS, 3, async (t) => [t.label, await fetchTabCops(t.path)])
  return Object.fromEntries(entries)
}

/** 상세 페이지에서 라벨(교육내용 등)에 해당하는 내용 셀 텍스트 추출 */
function detailField(html, label) {
  const re = new RegExp(
    'text_color3">\\s*' + label + '\\s*</span>[\\s\\S]*?<td[^>]*padding:10px[^>]*>([\\s\\S]*?)</td>',
  )
  const m = html.match(re)
  if (!m) return ''
  return m[1]
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

/** 상세 페이지 HTML → 보강 필드 */
function parseDetail(html) {
  return {
    curriculum: detailField(html, '교육내용'),
    target: detailField(html, '교육대상'),
    documents: detailField(html, '제출서류'),
    selection: detailField(html, '선발전형'),
    benefits: detailField(html, '교육특전'),
    extraCost: detailField(html, '추가비용'),
    // 모집기간 옆 "(추가모집시 연장될 수 있음)" 표기 여부
    recruitExtendable: /모집기간[\s\S]{0,200}?추가모집시 연장/.test(html),
  }
}

/** 상세코드(cop)로 상세 페이지를 읽어 보강 필드 반환. 실패 시 null(전체 동기화는 계속) */
async function scrapeDetail(cop) {
  try {
    const url = `${SOURCE_BASE}/sub1/course_1.aspx?listUrl=sub1.aspx&cop=${cop}&p=0&ename=&ct=&cwc=`
    const res = await fetch(url)
    if (!res.ok) return null
    return parseDetail(await res.text())
  } catch {
    return null
  }
}

/** 동시 실행 제한 map (사이트 부하 방지) */
async function mapPool(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/** raw 카드(+상세) → Course 객체(가공 규칙 적용) */
function toCourse(c, i, detail) {
  const cleanName = c.name.replace(/★[^★]*★/g, '').trim()
  const notes = []
  if (c.name.includes('개강확정')) notes.push('개강확정')
  if (c.eduDetail) notes.push(c.eduDetail)
  if (c.teacher) notes.push('강사 ' + c.teacher)
  const status = /상시모집|연중/.test(c.name) ? '모집중' : undefined
  const subsidized = c.subsidy > 0 || (c.fee === 0 && /무료|국비|내일배움|뉴딜/.test(c.name))
  const course = {
    // 안정적 고유 ID: 과정 상세코드(cop). 없으면 인덱스 폴백.
    // (동기화 때 사라진 과정을 '종료 보관'으로 유지하려면 ID가 안정적이어야 함)
    id: c.cop || 'c' + (i + 1),
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
  // 상세 페이지에서 가져온 공식 보강 정보 병합 (있는 값만)
  if (detail) {
    if (detail.curriculum) course.curriculum = detail.curriculum
    if (detail.target) course.target = detail.target
    if (detail.documents) course.documents = detail.documents
    if (detail.selection) course.selection = detail.selection
    if (detail.benefits) course.benefits = detail.benefits
    if (detail.extraCost) course.extraCost = detail.extraCost
    course.recruitExtendable = detail.recruitExtendable
  }
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
    const html = await res.text()
    const cards = parseText(toText(html))
    const cops = copCodes(html)
    if (cards.length !== cops.length) {
      console.warn(`[scraper] p=${p} 카드(${cards.length})와 상세코드(${cops.length}) 수 불일치 — 상세 병합 일부 누락 가능`)
    }
    cards.forEach((c, idx) => {
      c.cop = cops[idx]
    })
    raw.push(...cards)
  }
  if (raw.length === 0) {
    throw new Error('과정을 하나도 파싱하지 못했습니다. 사이트 구조가 바뀌었을 수 있습니다.')
  }
  // 각 과정 상세 페이지(교육내용/대상/서류/선발전형/특전)를 동시 5개씩 병합
  // + 과정 구분 탭(국민내일배움카드제/근로자직무능력향상 등) 소속 병렬 수집
  const [details, tabSets] = await Promise.all([
    mapPool(raw, 5, (c) => (c.cop ? scrapeDetail(c.cop) : null)),
    fetchTabMemberships(),
  ])
  return raw.map((c, i) => {
    const course = toCourse(c, i, details[i])
    if (c.cop) {
      const tabs = CATEGORY_TABS.map((t) => t.label).filter((label) => tabSets[label]?.has(c.cop))
      if (tabs.length) course.tabs = tabs
    }
    return course
  })
}
