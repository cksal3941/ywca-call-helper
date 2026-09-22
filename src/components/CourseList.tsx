import { useState } from 'react'
import { useCourseSearch, type StatusFilter } from '../hooks/useCourseSearch'
import { statusClass } from '../utils/status'
import { groupByCategory, categoryOf } from '../utils/category'
import type { Course, CourseStatus } from '../types'

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
}

export default function CourseList({
  courses,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [catFilter, setCatFilter] = useState<string>('all')

  const results = useCourseSearch(courses, query, filter)

  // 분야 칩 목록: 전체 과정 기준(검색해도 칩이 사라지지 않도록 안정적으로 유지)
  const categories = groupByCategory(courses).map((g) => g.category)

  const filtered =
    catFilter === 'all' ? results : results.filter((c) => categoryOf(c) === catFilter)
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
      <input
        type="text"
        className="courselist__search"
        placeholder="과정명 검색 (예: 컴활)"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="과정 검색"
      />

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

      <div className="courselist__cats">
        <button
          className={'cat-chip' + (catFilter === 'all' ? ' cat-chip--active' : '')}
          onClick={() => setCatFilter('all')}
        >
          전체 분야
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={'cat-chip' + (catFilter === cat ? ' cat-chip--active' : '')}
            onClick={() => setCatFilter((prev) => (prev === cat ? 'all' : cat))}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="courselist__count">{filtered.length}개 과정</div>

      <div className="courselist__items">
        {filtered.length === 0 && (
          <div className="courselist__empty">검색 결과가 없습니다.</div>
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
                            'course-item' + (c.id === selectedId ? ' course-item--active' : '')
                          }
                          onClick={() => onSelect(c.id)}
                        >
                          <div className="course-item__row">
                            <span className="course-item__name">{c.name}</span>
                            <StatusBadge status={c.computedStatus} />
                          </div>
                          <div className="course-item__meta">
                            <span>개강 {shortDate(c.eduStart)}</span>
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
