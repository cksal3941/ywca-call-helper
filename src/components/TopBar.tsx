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
  /** 로고 클릭 시 홈 화면으로 이동 */
  onHome: () => void
  callbackCount: number
  recruitingCount: number
  // 동기화 상태
  source: 'server' | 'fallback'
  updatedAt: string | null
  stale: boolean
  refreshing: boolean
  onRefresh: () => void
}

export default function TopBar({
  onHome,
  callbackCount,
  recruitingCount,
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
      <button className="topbar__brand" onClick={onHome} title="홈으로">
        YWCA
      </button>

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
          disabled={refreshing || source === 'fallback'}
          title={
            source === 'fallback'
              ? '오프라인 배포(내장 데이터) — 즉시 갱신은 서버 실행 시에만 가능'
              : '교육과정을 사이트에서 즉시 갱신'
          }
        >
          {refreshing ? '갱신 중…' : `↻ ${syncText}`}
        </button>
      </div>
    </header>
  )
}
