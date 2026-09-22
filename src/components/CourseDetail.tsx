import type { Course } from '../types'
import { STAFF_BY_ID } from '../data/staff'
import { getCourseStatus } from '../utils/status'
import { formatFee, formatPeriod } from '../utils/format'
import { StatusBadge } from './CourseList'

interface Props {
  course: Course | null
}

export default function CourseDetail({ course }: Props) {
  if (!course) {
    return (
      <div className="panel__placeholder">
        왼쪽에서 과정을 선택하면 상세정보가 표시됩니다.
      </div>
    )
  }

  const staff = STAFF_BY_ID[course.staffId]
  const status = getCourseStatus(course)

  return (
    <div className="detail">
      <div className="detail__head">
        <h3 className="detail__name">{course.name}</h3>
        <StatusBadge status={status} />
      </div>

      {/* 가장 자주 묻는 3가지를 크게 강조 */}
      <div className="detail__highlights">
        <Highlight label="수강료" value={formatFee(course.fee)} />
        <Highlight
          label="국비지원"
          value={course.isSubsidized ? '가능' : '해당 없음'}
          accent={course.isSubsidized}
        />
        <Highlight label="담당자" value={staff ? `${staff.name} (내선 ${staff.ext})` : '-'} />
      </div>

      <dl className="detail__grid">
        <Row label="모집기간" value={formatPeriod(course.recruitStart, course.recruitEnd)} />
        <Row label="교육기간" value={formatPeriod(course.eduStart, course.eduEnd)} />
        <Row label="교육요일" value={course.days} />
        <Row label="교육시간" value={course.time} />
        <EnrollRow enrolled={course.enrolled} capacity={course.capacity} />
        <Row label="강의실" value={course.room} />
        <Row label="신청방법" value={course.applyMethod} />
        <Row label="신청조건" value={course.applyCondition} />
        <Row label="준비서류" value={course.documents} />
        <Row
          label="담당부서"
          value={staff ? `${staff.dept} · ${staff.role}` : '-'}
        />
        {course.note && <Row label="비고" value={course.note} highlight />}
      </dl>

      {/* 수동 보강 정보 (있을 때만) */}
      {(course.curriculum || course.materials || course.refundPolicy) && (
        <dl className="detail__extra">
          {course.curriculum && <ExtraBlock label="교육내용" value={course.curriculum} />}
          {course.materials && <ExtraBlock label="준비물" value={course.materials} />}
          {course.refundPolicy && <ExtraBlock label="환불 규정" value={course.refundPolicy} />}
        </dl>
      )}
    </div>
  )
}

function ExtraBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail__extra-block">
      <dt className="detail__extra-label">{label}</dt>
      <dd className="detail__extra-value">{value}</dd>
    </div>
  )
}

/** 신청/정원 표시 + 여석·마감 안내 */
function EnrollRow({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  const remain = capacity - enrolled
  const full = remain <= 0
  const almost = !full && remain <= 3
  const tag = full ? '정원 마감' : almost ? `마감임박 (여석 ${remain})` : `여석 ${remain}명`
  const cls = full ? 'enroll--full' : almost ? 'enroll--almost' : 'enroll--ok'
  return (
    <div className="detail__row">
      <dt className="detail__label">모집인원</dt>
      <dd className="detail__value">
        신청 <b>{enrolled}</b> / 정원 {capacity}명{' '}
        <span className={`enroll-tag ${cls}`}>{tag}</span>
      </dd>
    </div>
  )
}

function Highlight({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={'highlight' + (accent ? ' highlight--accent' : '')}>
      <div className="highlight__label">{label}</div>
      <div className="highlight__value">{value}</div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={'detail__row' + (highlight ? ' detail__row--highlight' : '')}>
      <dt className="detail__label">{label}</dt>
      <dd className="detail__value">{value}</dd>
    </div>
  )
}
