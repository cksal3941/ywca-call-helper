import { useState } from 'react'
import type { CallMemo, CallStatus } from '../types'
import { formatDateTime, maskPhone } from '../utils/format'

interface Props {
  memos: CallMemo[]
  onUpdateStatus: (id: string, status: CallStatus) => void
  onDelete: (id: string) => void
}

type Tab = 'callback' | 'all'

const STATUS_CLASS: Record<CallStatus, string> = {
  안내완료: 'done',
  담당자연결: 'connect',
  담당자전달: 'handover',
  재연락필요: 'callback',
}

export default function MemoList({ memos, onUpdateStatus, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('callback')

  const callbacks = memos.filter((m) => m.status === '재연락필요')
  const list = tab === 'callback' ? callbacks : memos

  return (
    <div className="memolist">
      <div className="memolist__tabs">
        <button
          className={'memo-tab' + (tab === 'callback' ? ' memo-tab--active' : '')}
          onClick={() => setTab('callback')}
        >
          🔴 재연락 필요 {callbacks.length}
        </button>
        <button
          className={'memo-tab' + (tab === 'all' ? ' memo-tab--active' : '')}
          onClick={() => setTab('all')}
        >
          전체 기록 {memos.length}
        </button>
      </div>

      {list.length === 0 && (
        <div className="memolist__empty">
          {tab === 'callback' ? '재연락 필요 건이 없습니다.' : '저장된 메모가 없습니다.'}
        </div>
      )}

      <ul className="memolist__items">
        {list.map((m) => (
          <li key={m.id} className="memo-card">
            <div className="memo-card__top">
              <span className="memo-card__caller">
                {m.callerName || '이름 없음'}
                {m.phone && (
                  <span className="memo-card__phone"> · {maskPhone(m.phone)}</span>
                )}
              </span>
              <span className={`memo-badge memo-badge--${STATUS_CLASS[m.status]}`}>
                {m.status}
              </span>
            </div>

            {m.courseName && <div className="memo-card__course">{m.courseName}</div>}
            {m.content && <div className="memo-card__content">{m.content}</div>}
            {m.checkItem && (
              <div className="memo-card__check">확인: {m.checkItem}</div>
            )}

            <div className="memo-card__meta">
              <span>{formatDateTime(m.createdAt)}</span>
              {m.staffName && <span>담당 {m.staffName}</span>}
            </div>

            <div className="memo-card__actions">
              {m.status === '재연락필요' && (
                <button
                  className="memo-action memo-action--done"
                  onClick={() => onUpdateStatus(m.id, '안내완료')}
                >
                  완료 처리
                </button>
              )}
              <button
                className="memo-action memo-action--del"
                onClick={() => onDelete(m.id)}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
