/** 수강료 포맷: 0 → "무료", 그 외 → "150,000원" */
export function formatFee(fee: number): string {
  if (fee <= 0) return '무료'
  return `${fee.toLocaleString('ko-KR')}원`
}

/** YYYY-MM-DD → "2026. 10. 6" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${y}. ${Number(m)}. ${Number(d)}`
}

/** 기간 포맷: "2026. 10. 6 ~ 2026. 12. 12" */
export function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} ~ ${formatDate(end)}`
}

/**
 * 전화번호 마스킹 (기획서 15장 개인정보 보호).
 * 010-1234-5678 → 010-****-5678
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-***-${digits.slice(6)}`
  }
  // 형식을 알 수 없으면 뒤 4자리만 노출
  if (digits.length >= 4) {
    return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`
  }
  return phone
}

/** ISO 시각 → "14:32" */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** ISO 시각 → "9. 22 14:32" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}. ${d.getDate()} ${formatTime(iso)}`
}
