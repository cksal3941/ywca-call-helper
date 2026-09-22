import { useState } from 'react'
import type { CallMemo, CallStatus, Course } from '../types'
import { STAFF_BY_ID } from '../data/staff'

const STATUSES: CallStatus[] = ['안내완료', '담당자연결', '담당자전달', '재연락필요']

interface Props {
  selectedCourse: Course | null
  onSave: (memo: CallMemo) => void
}

const EMPTY = {
  callerName: '',
  phone: '',
  courseName: '',
  content: '',
  checkItem: '',
  staffName: '',
  memo: '',
}

export default function CallMemoForm({ selectedCourse, onSave }: Props) {
  const [form, setForm] = useState({ ...EMPTY })
  const [status, setStatus] = useState<CallStatus>('안내완료')
  const [saved, setSaved] = useState(false)

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  /** 현재 선택된 과정 정보를 폼에 채움 */
  function fillFromCourse() {
    if (!selectedCourse) return
    const staff = STAFF_BY_ID[selectedCourse.staffId]
    setForm((f) => ({
      ...f,
      courseName: selectedCourse.name,
      staffName: staff ? staff.name : f.staffName,
    }))
    setSaved(false)
  }

  function handleSave() {
    // 이름/연락처/과정 중 하나도 없으면 저장 방지
    if (!form.callerName && !form.phone && !form.courseName && !form.content) {
      return
    }
    const memo: CallMemo = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...form,
      status,
    }
    onSave(memo)
    setForm({ ...EMPTY })
    setStatus('안내완료')
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="memo-form">
      {selectedCourse && (
        <button className="memo-form__fill" onClick={fillFromCourse}>
          + 선택 과정 넣기 ({selectedCourse.name})
        </button>
      )}

      <div className="memo-form__row2">
        <Field label="이름">
          <input
            value={form.callerName}
            onChange={(e) => update('callerName', e.target.value)}
            placeholder="문의자"
          />
        </Field>
        <Field label="연락처">
          <input
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="010-0000-0000"
            inputMode="tel"
          />
        </Field>
      </div>

      <Field label="문의 과정">
        <input
          value={form.courseName}
          onChange={(e) => update('courseName', e.target.value)}
          placeholder="예: 컴퓨터활용능력 2급"
        />
      </Field>

      <Field label="문의 내용">
        <textarea
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          placeholder="예: 개강일 및 수강료 문의"
          rows={2}
        />
      </Field>

      <Field label="확인할 사항">
        <input
          value={form.checkItem}
          onChange={(e) => update('checkItem', e.target.value)}
          placeholder="예: 수강료 담당자 확인 필요"
        />
      </Field>

      <div className="memo-form__row2">
        <Field label="담당자">
          <input
            value={form.staffName}
            onChange={(e) => update('staffName', e.target.value)}
            placeholder="담당자명"
          />
        </Field>
        <Field label="추가 메모">
          <input
            value={form.memo}
            onChange={(e) => update('memo', e.target.value)}
            placeholder="비고"
          />
        </Field>
      </div>

      <div className="memo-form__status">
        <span className="memo-form__status-label">처리 상태</span>
        <div className="memo-form__status-btns">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={
                'status-btn' +
                (status === s ? ' status-btn--active' : '') +
                (s === '재연락필요' ? ' status-btn--alert' : '')
              }
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button className="memo-form__save" onClick={handleSave}>
        {saved ? '저장됨 ✓' : '메모 저장'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}
