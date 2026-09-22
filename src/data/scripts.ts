import type { ScriptItem } from '../types'

/** 상황별 전화응대 스크립트 (기획서 8장) */
export const SCRIPTS: ScriptItem[] = [
  {
    situation: '전화 시작',
    text: '안녕하세요. 대전여성인력개발센터입니다. 무엇을 도와드릴까요?',
  },
  {
    situation: '과정 문의',
    text: '문의하시는 과정명이 어떻게 되실까요?',
  },
  {
    situation: '확인이 필요한 경우',
    text: '해당 내용은 정확한 확인이 필요한 사항이라 담당자 확인 후 안내드리겠습니다.',
  },
  {
    situation: '담당자 연결',
    text: '해당 과정 담당자에게 연결해드리겠습니다. 잠시만 기다려주세요.',
  },
  {
    situation: '담당자 부재',
    text: '현재 담당자가 자리에 없어 문의 내용을 전달해드리겠습니다. 성함과 연락처를 남겨주시겠어요?',
  },
  {
    situation: '전화 종료',
    text: '추가로 궁금하신 사항 있으실까요? 감사합니다.',
  },
]
