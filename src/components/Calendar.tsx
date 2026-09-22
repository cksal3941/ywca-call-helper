import { useMemo, useState } from 'react'
import type { Course } from '../types'
import { todayStr } from '../utils/status'

interface Props {
  courses: Course[]
  onSelectCourse: (id: string) => void
  /** 처음 보여줄 연/월 (없으면 이번 달) */
  initialYear?: number
  initialMonth?: number
  /** 강조할 과정 ID (해당 과정 일정에 테두리 강조) */
  highlightId?: string
}

type EventType = 'open' | 'close' | 'end'

interface DayEvent {
  type: EventType
  course: Course
}

const TYPE_LABEL: Record<EventType, string> = {
  open: '개강',
  close: '모집마감',
  end: '종료',
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function Calendar({
  courses,
  onSelectCourse,
  initialYear,
  initialMonth,
  highlightId,
}: Props) {
  const today = todayStr()
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))]
  const [year, setYear] = useState(initialYear ?? ty)
  const [month, setMonth] = useState(initialMonth ?? tm) // 1~12

  // 날짜(YYYY-MM-DD) → 이벤트 목록
  const eventsByDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    const add = (date: string, type: EventType, course: Course) => {
      if (!date) return
      const arr = map.get(date)
      if (arr) arr.push({ type, course })
      else map.set(date, [{ type, course }])
    }
    for (const c of courses) {
      add(c.eduStart, 'open', c)
      add(c.recruitEnd, 'close', c)
      add(c.eduEnd, 'end', c)
    }
    return map
  }, [courses])

  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // 그리드 셀(앞쪽 빈칸 포함)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function move(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setYear(y)
    setMonth(m)
  }

  function goToday() {
    setYear(ty)
    setMonth(tm)
  }

  // 이번 달 이벤트 개수 요약
  const monthPrefix = `${year}-${pad(month)}`
  let openCnt = 0
  let closeCnt = 0
  for (const [date, evs] of eventsByDate) {
    if (!date.startsWith(monthPrefix)) continue
    for (const e of evs) {
      if (e.type === 'open') openCnt++
      else if (e.type === 'close') closeCnt++
    }
  }

  return (
    <div className="cal">
      <div className="cal__bar">
        <div className="cal__nav">
          <button className="cal__navbtn" onClick={() => move(-1)} aria-label="이전 달">‹</button>
          <span className="cal__title">
            {year}년 {month}월
          </span>
          <button className="cal__navbtn" onClick={() => move(1)} aria-label="다음 달">›</button>
          <button className="cal__today" onClick={goToday}>오늘</button>
        </div>
        <div className="cal__legend">
          <span><i className="dot dot--open" /> 개강 {openCnt}</span>
          <span><i className="dot dot--close" /> 모집마감 {closeCnt}</span>
          <span><i className="dot dot--end" /> 종료</span>
        </div>
      </div>

      <div className="cal__grid cal__head">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={
              'cal__dow' + (i === 0 ? ' cal__dow--sun' : i === 6 ? ' cal__dow--sat' : '')
            }
          >
            {d}
          </div>
        ))}
      </div>

      <div className="cal__grid">
        {cells.map((d, idx) => {
          if (d === null) return <div key={`e${idx}`} className="cal__cell cal__cell--empty" />
          const date = `${year}-${pad(month)}-${pad(d)}`
          const evs = eventsByDate.get(date) ?? []
          const isToday = date === today
          return (
            <div key={date} className={'cal__cell' + (isToday ? ' cal__cell--today' : '')}>
              <div className="cal__daynum">{d}</div>
              <div className="cal__events">
                {evs.map((e, i) => (
                  <button
                    key={i}
                    className={
                      `cal__event cal__event--${e.type}` +
                      (highlightId && e.course.id === highlightId ? ' cal__event--hl' : '')
                    }
                    onClick={() => onSelectCourse(e.course.id)}
                    title={`[${TYPE_LABEL[e.type]}] ${e.course.name}`}
                  >
                    <span className="cal__event-tag">{TYPE_LABEL[e.type]}</span>
                    {e.course.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
