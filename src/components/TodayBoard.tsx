import { useMemo } from 'react'
import type { CallMemo, Course } from '../types'
import {
  getCourseStatus,
  isStartingToday,
  isEndingToday,
  isRecruitClosingToday,
} from '../utils/status'
import { groupByCategory } from '../utils/category'

interface Props {
  courses: Course[]
  memos: CallMemo[]
  onSelectCourse: (id: string) => void
}

export default function TodayBoard({ courses, memos, onSelectCourse }: Props) {
  const groups = useMemo(() => {
    return {
      starting: courses.filter((c) => isStartingToday(c)),
      ending: courses.filter((c) => isEndingToday(c)),
      closing: courses.filter((c) => isRecruitClosingToday(c)),
      recruiting: courses.filter((c) => getCourseStatus(c) === '모집중'),
    }
  }, [courses])

  const callbacks = memos.filter((m) => m.status === '재연락필요')

  return (
    <div className="today">
      <div className="today__head">
        <span className="today__badge">오늘의 업무</span>
        <span className="today__hint">왼쪽에서 과정을 선택하면 상세정보가 표시됩니다.</span>
      </div>

      <div className="today__grid">
        <Card title="오늘 개강" accent="start" courses={groups.starting} onSelect={onSelectCourse} />
        <Card title="오늘 종료" accent="end" courses={groups.ending} onSelect={onSelectCourse} />
        <Card title="오늘 모집마감" accent="close" courses={groups.closing} onSelect={onSelectCourse} />

        <div className="today-card today-card--callback">
          <div className="today-card__title">🔴 재연락 필요 ({callbacks.length})</div>
          {callbacks.length === 0 ? (
            <div className="today-card__empty">없음</div>
          ) : (
            <ul className="today-card__list">
              {callbacks.slice(0, 6).map((m) => (
                <li key={m.id} className="today-card__memo">
                  <b>{m.callerName || '이름 없음'}</b>
                  {m.courseName && <span> · {m.courseName}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="today-card today-card--wide">
          <div className="today-card__title">현재 모집 중인 과정 ({groups.recruiting.length})</div>
          <div className="today-cats">
            {groupByCategory(groups.recruiting).map((g) => (
              <div key={g.category} className="today-cat">
                <div className="today-cat__head">
                  {g.category} <span className="today-cat__count">{g.courses.length}</span>
                </div>
                <div className="today-card__chips">
                  {g.courses.map((c) => (
                    <button
                      key={c.id}
                      className="today-chip"
                      onClick={() => onSelectCourse(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({
  title,
  accent,
  courses,
  onSelect,
}: {
  title: string
  accent: 'start' | 'end' | 'close'
  courses: Course[]
  onSelect: (id: string) => void
}) {
  return (
    <div className={`today-card today-card--${accent}`}>
      <div className="today-card__title">{title}</div>
      {courses.length === 0 ? (
        <div className="today-card__empty">없음</div>
      ) : (
        <ul className="today-card__list">
          {courses.map((c) => (
            <li key={c.id}>
              <button className="today-card__link" onClick={() => onSelect(c.id)}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
