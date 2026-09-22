import { useStaffSearch } from '../hooks/useStaffSearch'
import type { Course } from '../types'

interface Props {
  byId: Record<string, Course>
  query: string
  onSelectCourse: (id: string) => void
}

export default function StaffResult({ byId, query, onSelectCourse }: Props) {
  const staff = useStaffSearch(byId, query)

  if (staff.length === 0) return null

  return (
    <div className="staffresult">
      <div className="staffresult__title">담당자 {staff.length}명</div>
      {staff.map((s) => (
        <div key={s.id} className="staff-card">
          <div className="staff-card__head">
            <span className="staff-card__name">{s.name}</span>
            <span className="staff-card__ext">내선 {s.ext}</span>
          </div>
          <div className="staff-card__dept">
            {s.dept} · {s.role}
          </div>
          <div className="staff-card__courses">
            {s.courses.map((c) => (
              <button
                key={c.id}
                className="staff-course-chip"
                onClick={() => onSelectCourse(c.id)}
                title="이 과정 상세 보기"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
