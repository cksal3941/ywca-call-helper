import { useEffect, useRef, useState } from 'react'
import { useCourseSearch, type StatusFilter } from '../hooks/useCourseSearch'
import { statusClass, isAlwaysOpen } from '../utils/status'
import { groupByCategory } from '../utils/category'
import type { Course, CourseStatus } from '../types'

/**
 * 재원/대상 구분 필터. 국비 재원·대상(실업자/재직자) 구분이 목적이므로
 * 분야 필터와 겹치는 취업교육·사회문화·기타 등은 제외한다(중복 방지).
 */
const FUNDING_TABS: { tab: string; label: string }[] = [
  { tab: '국민내일배움카드제', label: '내일배움카드(실업자)' },
  { tab: '근로자직무능력향상', label: '근로자 직무향상' },
]

/**
 * 과정 검색 입력창.
 * 한글 IME 조합(ㅈ→조→조ㄹ→조리) 중에는 상위 query를 갱신하지 않아
 * 목록 재렌더로 조합이 끊기는 것을 막고, 조합이 끝나면 확정한다.
 * (영문·숫자는 조합이 없으므로 입력 즉시 반영)
 */
function SearchBox({
  value,
  onChange,
  inputRef,
}: {
  value: string
  onChange: (v: string) => void
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const [text, setText] = useState(value)
  const composing = useRef(false)

  // 외부에서 value가 바뀌면(ESC로 초기화 등) 입력창도 동기화
  useEffect(() => setText(value), [value])

  return (
    <input
      ref={inputRef}
      type="text"
      className="courselist__search"
      placeholder="과정명 · 분야 검색 (예: 조리)  ('/' 키로 바로 검색)"
      value={text}
      onChange={(e) => {
        const v = e.target.value
        setText(v)
        // 조합 중이 아닐 때만 즉시 검색 확정
        if (!composing.current) onChange(v)
      }}
      onCompositionStart={() => {
        composing.current = true
      }}
      onCompositionEnd={(e) => {
        composing.current = false
        onChange(e.currentTarget.value) // 조합 완료 → 검색 확정
      }}
      aria-label="과정 검색"
    />
  )
}

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: '전체', value: 'all' },
  { label: '모집중', value: '모집중' },
  { label: '개강예정', value: '개강예정' },
  { label: '모집마감', value: '모집마감' },
  { label: '교육중', value: '교육중' },
  { label: '종료', value: '종료' },
]

/** '2026-10-26' → '10/26' */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return m && d ? `${Number(m)}/${Number(d)}` : iso
}

interface Props {
  courses: Course[]
  query: string
  onQueryChange: (q: string) => void
  filter: StatusFilter
  onFilterChange: (f: StatusFilter) => void
  selectedId: string | null
  onSelect: (id: string) => void
  searchRef?: React.Ref<HTMLInputElement>
}

export default function CourseList({
  courses,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  searchRef,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [tabFilter, setTabFilter] = useState<string>('all')
  const [subsidizedOnly, setSubsidizedOnly] = useState(false)

  const results = useCourseSearch(courses, query, filter)

  // 재원 칩: 실제 과정이 속한 탭만 노출
  const presentTabs = new Set(courses.flatMap((c) => c.tabs ?? []))
  const fundingChips = FUNDING_TABS.filter((f) => presentTabs.has(f.tab))

  const filtered = results.filter((c) => {
    if (tabFilter !== 'all' && !(c.tabs ?? []).includes(tabFilter)) return false
    if (subsidizedOnly && !c.isSubsidized) return false
    return true
  })
  const groups = groupByCategory(filtered)

  // 검색 중에는 접힘 무시하고 모두 펼쳐 보여준다(놓치지 않도록)
  const searching = query.trim().length > 0

  function toggle(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className="courselist">
      <SearchBox value={query} onChange={onQueryChange} inputRef={searchRef} />

      <div className="courselist__filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={
              'filter-chip' + (filter === f.value ? ' filter-chip--active' : '')
            }
            onClick={() => onFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {fundingChips.length > 0 && (
        <div className="courselist__funding">
          <span className="courselist__funding-label">재원</span>
          <button
            className={'fund-chip' + (tabFilter === 'all' ? ' fund-chip--active' : '')}
            onClick={() => setTabFilter('all')}
          >
            전체
          </button>
          {fundingChips.map((f) => (
            <button
              key={f.tab}
              className={'fund-chip' + (tabFilter === f.tab ? ' fund-chip--active' : '')}
              onClick={() => setTabFilter((prev) => (prev === f.tab ? 'all' : f.tab))}
              title={f.tab}
            >
              {f.label}
            </button>
          ))}
          <button
            className={'fund-chip fund-chip--subsidy' + (subsidizedOnly ? ' fund-chip--active' : '')}
            onClick={() => setSubsidizedOnly((v) => !v)}
            title="국비지원(내일배움카드 등) 과정만 보기"
          >
            💰 국비지원
          </button>
        </div>
      )}

      <div className="courselist__count">{filtered.length}개 과정</div>

      <div className="courselist__items">
        {filtered.length === 0 && (
          <div className="courselist__empty">
            {query.trim() ? '검색 결과가 없습니다.' : '해당 조건의 과정이 없습니다.'}
          </div>
        )}
        {groups.map((g) => {
          const isCollapsed = !searching && collapsed.has(g.category)
          return (
            <div key={g.category} className="course-group">
              <button
                className="course-group__head"
                onClick={() => toggle(g.category)}
                aria-expanded={!isCollapsed}
              >
                <span className="course-group__caret">{isCollapsed ? '▸' : '▾'}</span>
                {g.category} <span className="course-group__count">{g.courses.length}</span>
              </button>
              {!isCollapsed && (
                <ul className="course-group__items">
                  {g.courses.map((c) => {
                    const remain = c.capacity - c.enrolled
                    const remainCls =
                      remain <= 0 ? 'remain--full' : remain <= 3 ? 'remain--almost' : 'remain--ok'
                    return (
                      <li key={c.id}>
                        <button
                          className={
                            'course-item' +
                            (c.id === selectedId ? ' course-item--active' : '') +
                            (c.archived ? ' course-item--archived' : '')
                          }
                          onClick={() => onSelect(c.id)}
                        >
                          <div className="course-item__row">
                            <span className="course-item__name">{c.name}</span>
                            <StatusBadge status={c.computedStatus} />
                          </div>
                          <div className="course-item__meta">
                            <span>{isAlwaysOpen(c) ? '상시모집' : `개강 ${shortDate(c.eduStart)}`}</span>
                            <span className={`course-item__remain ${remainCls}`}>
                              {remain <= 0 ? '정원 마감' : `여석 ${remain}`}
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={`badge badge--${statusClass(status)}`}>{status}</span>
  )
}
