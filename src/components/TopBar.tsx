function todayLabel(): string {
  const now = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()} (${days[now.getDay()]})`
}

/** ISO → "9. 22 08:00" */
function syncLabel(iso: string | null): string {
  if (!iso) return '동기화 정보 없음'
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}. ${d.getDate()} ${hh}:${mm}`
}

interface Props {
  query: string
  onQueryChange: (q: string) => void
  callbackCount: number
  recruitingCount: number
  searchRef?: React.Ref<HTMLInputElement>
  // 동기화 상태
  source: 'server' | 'fallback'
  updatedAt: string | null
  stale: boolean
  refreshing: boolean
  onRefresh: () => void
}

export default function TopBar({
  query,
  onQueryChange,
  callbackCount,
  recruitingCount,
  searchRef,
  source,
  updatedAt,
  stale,
  refreshing,
  onRefresh,
}: Props) {
  const syncText =
    source === 'fallback'
      ? '오프라인(내장 데이터)'
      : `동기화 ${syncLabel(updatedAt)}${stale ? ' ⚠' : ''}`

  return (
    <header className="topbar">
      <div className="topbar__brand">YWCA 전화응대 업무도우미</div>

      <div className="topbar__search">
        <input
          ref={searchRef}
          type="text"
          className="topbar__search-input"
          placeholder="과정명 · 담당자 통합 검색  ('/' 키로 바로 검색)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="통합 검색"
        />
      </div>

      <div className="topbar__meta">
        <span className="topbar__date">{todayLabel()}</span>
        <span className="topbar__stat">
          모집중 <b>{recruitingCount}</b>
        </span>
        <span className="topbar__stat topbar__stat--alert">
          재연락 <b>{callbackCount}</b>
        </span>
        <button
          className={'topbar__sync' + (stale ? ' topbar__sync--stale' : '')}
          onClick={onRefresh}
          disabled={refreshing}
          title="교육과정을 사이트에서 즉시 갱신"
        >
          {refreshing ? '갱신 중…' : `↻ ${syncText}`}
        </button>
      </div>
    </header>
  )
}
