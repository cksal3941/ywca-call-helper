import { useState } from 'react'
import type { Course } from '../types'
import { FAQ } from '../data/faq'
import { buildFaqAnswer } from '../utils/faqAnswer'

interface Props {
  course: Course | null
}

export default function Faq({ course }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const activeFaq = FAQ.find((f) => f.id === activeId) ?? null
  const answer = activeFaq ? buildFaqAnswer(activeFaq, course) : ''

  function handleClick(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
    setCopied(false)
  }

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 권한 없으면 무시 */
    }
  }

  return (
    <div className="faq">
      <h3 className="faq__title">❓ 자주 묻는 질문</h3>

      <div className="faq__buttons">
        {FAQ.map((f) => (
          <button
            key={f.id}
            className={'faq-btn' + (f.id === activeId ? ' faq-btn--active' : '')}
            onClick={() => handleClick(f.id)}
          >
            {f.question}
          </button>
        ))}
      </div>

      {activeFaq && (
        <div className="faq__answer">
          <div className="faq__answer-text">{answer}</div>
          <button className="faq__copy" onClick={copyAnswer}>
            {copied ? '복사됨 ✓' : '답변 복사'}
          </button>
        </div>
      )}
    </div>
  )
}
