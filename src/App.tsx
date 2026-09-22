import { useEffect, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import CourseList from './components/CourseList'
import CourseDetail from './components/CourseDetail'
import Faq from './components/Faq'
import CallMemoForm from './components/CallMemo'
import MemoList from './components/MemoList'
import StaffResult from './components/StaffResult'
import TodayBoard from './components/TodayBoard'
import Calendar from './components/Calendar'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useCourses } from './hooks/useCourses'
import { purgeOldMemos, RETENTION_DAYS } from './utils/retention'
import { getCourseStatus } from './utils/status'
import type { StatusFilter } from './hooks/useCourseSearch'
import type { CallMemo } from './types'

export default function App() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [boardView, setBoardView] = useState<'today' | 'calendar'>('today')
  const [detailView, setDetailView] = useState<'detail' | 'calendar'>('detail')
  const [memos, setMemos] = useLocalStorage<CallMemo[]>('ywca_memos', [])
  const searchRef = useRef<HTMLInputElement>(null)

  /** 과정 선택 시 항상 상세 탭으로 진입 */
  function selectCourse(id: string) {
    setSelectedId(id)
    setDetailView('detail')
  }

  const { courses, byId, updatedAt, stale, source, refreshing, refresh } = useCourses()

  const selectedCourse = selectedId ? byId[selectedId] ?? null : null
  const callbackCount = memos.filter((m) => m.status === '재연락필요').length
  const recruitingCount = courses.filter((c) => getCourseStatus(c) === '모집중').length

  // 실행 시 보관기간(90일) 지난 메모 자동 정리 (기획서 15장)
  useEffect(() => {
    setMemos((prev) => {
      const cleaned = purgeOldMemos(prev)
      return cleaned.length === prev.length ? prev : cleaned
    })
  }, [setMemos])

  // 키보드 단축키: "/" 검색 포커스, ESC 선택 해제/검색어 초기화
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      const typing =
        el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable

      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'Escape') {
        if (selectedId) {
          setSelectedId(null)
        } else if (query) {
          setQuery('')
        }
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, query])

  function addMemo(memo: CallMemo) {
    setMemos((prev) => [memo, ...prev])
  }

  function updateMemoStatus(id: string, status: CallMemo['status']) {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
  }

  function deleteMemo(id: string) {
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="app">
      <TopBar
        query={query}
        onQueryChange={setQuery}
        callbackCount={callbackCount}
        recruitingCount={recruitingCount}
        searchRef={searchRef}
        source={source}
        updatedAt={updatedAt}
        stale={stale}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      <div className="workspace">
        {/* 왼쪽: 교육과정 검색 */}
        <section className="panel panel--left" aria-label="교육과정 검색">
          <h2 className="panel__title">교육과정 · 담당자 검색</h2>
          <StaffResult byId={byId} query={query} onSelectCourse={selectCourse} />
          <CourseList
            courses={courses}
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
            selectedId={selectedId}
            onSelect={selectCourse}
          />
        </section>

        {/* 중앙: 과정 미선택 시 오늘의 업무 / 선택 시 상세 + FAQ */}
        <section className="panel panel--center" aria-label="과정 상세정보">
          {selectedCourse ? (
            <>
              <div className="panel__titlebar">
                <div className="board-tabs">
                  <button
                    className={'board-tab' + (detailView === 'detail' ? ' board-tab--active' : '')}
                    onClick={() => setDetailView('detail')}
                  >
                    상세정보
                  </button>
                  <button
                    className={'board-tab' + (detailView === 'calendar' ? ' board-tab--active' : '')}
                    onClick={() => setDetailView('calendar')}
                  >
                    📅 캘린더
                  </button>
                </div>
                <button className="panel__back" onClick={() => setSelectedId(null)}>
                  ← 오늘의 업무
                </button>
              </div>
              {detailView === 'detail' ? (
                <>
                  <CourseDetail course={selectedCourse} />
                  <Faq course={selectedCourse} />
                </>
              ) : (
                <Calendar
                  key={selectedCourse.id}
                  courses={courses}
                  onSelectCourse={selectCourse}
                  initialYear={Number(selectedCourse.eduStart.slice(0, 4))}
                  initialMonth={Number(selectedCourse.eduStart.slice(5, 7))}
                  highlightId={selectedCourse.id}
                />
              )}
            </>
          ) : (
            <>
              <div className="board-tabs">
                <button
                  className={'board-tab' + (boardView === 'today' ? ' board-tab--active' : '')}
                  onClick={() => setBoardView('today')}
                >
                  오늘의 업무
                </button>
                <button
                  className={'board-tab' + (boardView === 'calendar' ? ' board-tab--active' : '')}
                  onClick={() => setBoardView('calendar')}
                >
                  📅 캘린더
                </button>
              </div>
              {boardView === 'today' ? (
                <TodayBoard courses={courses} memos={memos} onSelectCourse={selectCourse} />
              ) : (
                <Calendar courses={courses} onSelectCourse={selectCourse} />
              )}
            </>
          )}
        </section>

        {/* 오른쪽: 전화응대 메모 */}
        <section className="panel panel--right" aria-label="전화응대 메모">
          <h2 className="panel__title">📞 전화응대 메모</h2>
          <CallMemoForm selectedCourse={selectedCourse} onSave={addMemo} />
          <MemoList
            memos={memos}
            onUpdateStatus={updateMemoStatus}
            onDelete={deleteMemo}
          />
          <p className="privacy-note">
            🔒 메모는 이 브라우저에만 저장되며 외부로 전송되지 않습니다.
            {' '}작성 후 {RETENTION_DAYS}일이 지나면 자동 삭제됩니다.
          </p>
        </section>
      </div>
    </div>
  )
}
