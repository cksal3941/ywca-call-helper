import { useEffect, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import CourseList from './components/CourseList'
import CourseDetail from './components/CourseDetail'
import Faq from './components/Faq'
import CallMemoForm from './components/CallMemo'
import MemoList from './components/MemoList'
import type { MemoTab } from './components/MemoList'
import TodayBoard from './components/TodayBoard'
import Calendar from './components/Calendar'
import { useMemos } from './hooks/useMemos'
import { useCourses } from './hooks/useCourses'
import { RETENTION_DAYS } from './utils/retention'
import { getCourseStatus } from './utils/status'
import type { StatusFilter } from './hooks/useCourseSearch'
import type { CallMemo } from './types'

export default function App() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [boardView, setBoardView] = useState<'today' | 'calendar'>('today')
  const [detailView, setDetailView] = useState<'detail' | 'calendar'>('detail')
  const { memos, error: memoError, mode: memoMode, add: addMemoToServer, updateStatus, remove } = useMemos()
  const [memoTab, setMemoTab] = useState<MemoTab>('callback')
  const searchRef = useRef<HTMLInputElement>(null)

  /** 과정 선택 시 항상 상세 탭으로 진입 */
  function selectCourse(id: string) {
    setSelectedId(id)
    setDetailView('detail')
  }

  /** 홈(초기 화면)으로: 선택 해제 + 오늘의 업무 + 검색/필터 초기화 */
  function goHome() {
    setSelectedId(null)
    setBoardView('today')
    setQuery('')
    setFilter('all')
  }

  const { courses, byId, updatedAt, stale, source, refreshing, refresh } = useCourses()

  const selectedCourse = selectedId ? byId[selectedId] ?? null : null
  const callbackCount = memos.filter((m) => m.status === '재연락필요').length
  const recruitingCount = courses.filter((c) => getCourseStatus(c) === '모집중').length

  // 보관기간(90일) 자동 정리는 서버(server/memos.mjs)에서 수행한다.

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
    // 저장한 메모가 곧바로 보이도록 해당 상태의 탭으로 전환
    setMemoTab(memo.status === '재연락필요' ? 'callback' : 'all')
    void addMemoToServer(memo)
  }

  return (
    <div className="app">
      <TopBar
        onHome={goHome}
        callbackCount={callbackCount}
        recruitingCount={recruitingCount}
        source={source}
        updatedAt={updatedAt}
        stale={stale}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      <div className="workspace">
        {/* 왼쪽: 교육과정 검색 */}
        <section className="panel panel--left" aria-label="교육과정 검색">
          <h2 className="panel__title">교육과정 검색</h2>
          <CourseList
            courses={courses}
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
            selectedId={selectedId}
            onSelect={selectCourse}
            searchRef={searchRef}
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
                  ← 뒤로가기
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
          {memoError && <div className="memo-error">⚠ {memoError}</div>}
          <MemoList
            memos={memos}
            onUpdateStatus={updateStatus}
            onDelete={remove}
            tab={memoTab}
            onTabChange={setMemoTab}
          />
          <p className="privacy-note">
            🔒 {memoMode === 'server'
              ? '메모는 이 업무도우미 서버에만 저장됩니다.'
              : '메모는 이 브라우저에만 저장됩니다(외부 전송 없음).'}
            {' '}작성 후 {RETENTION_DAYS}일이 지나면 자동 삭제됩니다.
          </p>
        </section>
      </div>
    </div>
  )
}
