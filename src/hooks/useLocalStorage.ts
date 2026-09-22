import { useCallback, useEffect, useState } from 'react'

/**
 * localStorage 와 동기화되는 상태 훅.
 * 개인정보(전화메모)는 서버 전송 없이 이 브라우저에만 저장된다 (기획서 15장).
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* 저장 공간 초과 등은 무시 */
    }
  }, [key, state])

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value)
    },
    [],
  )

  return [state, set]
}
