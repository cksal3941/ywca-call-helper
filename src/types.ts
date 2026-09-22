/** 교육과정 모집/진행 상태 */
export type CourseStatus =
  | '모집중'
  | '개강예정'
  | '모집마감'
  | '교육중'
  | '종료'

/** 교육과정 (기획서 14장) */
export interface Course {
  id: string
  name: string
  /** 모집 시작일 (YYYY-MM-DD) */
  recruitStart: string
  /** 모집 종료일 (YYYY-MM-DD) */
  recruitEnd: string
  /** 교육 시작일 (YYYY-MM-DD) */
  eduStart: string
  /** 교육 종료일 (YYYY-MM-DD) */
  eduEnd: string
  /** 교육 요일 (예: "월,수,금") */
  days: string
  /** 교육 시간 (예: "09:00~13:00") */
  time: string
  /** 수강료 (원). 0이면 무료 */
  fee: number
  /** 국비지원 여부 */
  isSubsidized: boolean
  /** 모집 정원 */
  capacity: number
  /** 현재 신청(등록) 인원 */
  enrolled: number
  /** 신청 방법 */
  applyMethod: string
  /** 신청 조건 */
  applyCondition: string
  /** 준비 서류 */
  documents: string
  /** 강의실 */
  room: string
  /** 담당자 ID (Staff.id 참조) */
  staffId: string
  /** 상태 수동 지정(override). 없으면 날짜 기준 자동 계산 */
  status?: CourseStatus
  /** 비고 */
  note?: string

  // ── 수동 보강 필드 (사이트에 없어 별도 입력, supplements.ts 에서 병합) ──
  /** 교육내용 / 커리큘럼 */
  curriculum?: string
  /** 준비물 */
  materials?: string
  /** 환불 규정 */
  refundPolicy?: string
}

/** 담당자 (기획서 14장) */
export interface Staff {
  id: string
  name: string
  /** 부서 */
  dept: string
  /** 담당 업무 */
  role: string
  /** 내선번호 */
  ext: string
  /** 담당 과정 ID 목록 (Course.id 참조) */
  courseIds: string[]
}

/** 전화 문의 처리 상태 (기획서 6장) */
export type CallStatus =
  | '안내완료'
  | '담당자연결'
  | '담당자전달'
  | '재연락필요'

/** 전화응대 메모 (기획서 14장) */
export interface CallMemo {
  id: string
  /** 생성 시각 (ISO 문자열) */
  createdAt: string
  /** 문의자 이름 */
  callerName: string
  /** 연락처 */
  phone: string
  /** 문의 과정 */
  courseName: string
  /** 문의 내용 */
  content: string
  /** 확인할 사항 */
  checkItem: string
  /** 담당자 */
  staffName: string
  /** 처리 상태 */
  status: CallStatus
  /** 추가 메모 */
  memo: string
}

/** FAQ 항목 (기획서 7장) */
export interface FaqItem {
  id: string
  question: string
  /**
   * 답변 템플릿. {name}{fee}{eduPeriod}{recruitPeriod}{time}{days}
   * {room}{applyMethod}{documents}{staff}{ext}{status} 치환.
   * 과정 미선택 시 사용할 일반 답변은 fallback 사용.
   */
  template: string
  /** 과정 미선택 시 답변 */
  fallback: string
}

/** 응대 스크립트 (기획서 8장) */
export interface ScriptItem {
  situation: string
  text: string
}
