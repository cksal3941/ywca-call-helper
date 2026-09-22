import type { FaqItem } from '../types'

/**
 * 자주 묻는 질문 (기획서 7장).
 * template: 과정 선택 시 해당 과정 정보로 치환.
 * fallback: 과정 미선택 시 안내 문구.
 */
export const FAQ: FaqItem[] = [
  {
    id: 'f1',
    question: '현재 모집 중인가요?',
    template: '{name} 과정은 현재 "{status}" 상태입니다. 모집기간은 {recruitPeriod} 입니다.',
    fallback: '왼쪽에서 과정을 선택하시면 해당 과정의 모집 상태를 안내드립니다.',
  },
  {
    id: 'f2',
    question: '언제 개강하나요?',
    template:
      '{name} 개강일은 {openDate}이며 {days}에 진행됩니다. (교육기간 {eduPeriod} · 모집기간 {recruitPeriod})',
    fallback: '문의하시는 과정명을 알려주시면 개강일과 요일을 확인해 안내드리겠습니다.',
  },
  {
    id: 'f3',
    question: '수강료는 얼마인가요?',
    template: '{name} 과정의 수강료는 {fee} 입니다. (국비지원: {subsidized})',
    fallback: '과정별로 수강료가 다릅니다. 문의 과정을 선택해 주세요.',
  },
  {
    id: 'f4',
    question: '국비지원이 가능한가요?',
    template:
      '{name} 과정의 국비지원 여부: {subsidized}. 국민내일배움카드 발급 대상 여부 등 지원 자격은 담당자 확인이 필요합니다.',
    fallback:
      '국비지원(국민내일배움카드) 여부는 과정마다 다릅니다. 문의 과정을 선택해 주세요.',
  },
  {
    id: 'f5',
    question: '신청은 어떻게 하나요?',
    template:
      '{name} 과정은 [{applyMethod}]으로 신청하실 수 있습니다. (대표전화 042-524-4181) 신청조건: {condition}',
    fallback:
      '전화(042-524-4181) 또는 방문으로 접수하실 수 있습니다. 과정을 선택하면 정확히 안내드립니다.',
  },
  {
    id: 'f6',
    question: '필요한 서류가 있나요?',
    template: '{name} 과정 신청 시 준비서류: {documents}',
    fallback: '과정에 따라 필요 서류가 다릅니다. 문의 과정을 선택해 주세요.',
  },
  {
    id: 'f7',
    question: '몇 시부터 몇 시까지 수업인가요?',
    template: '{name} 과정은 {days} / {time} 진행됩니다.',
    fallback: '과정을 선택하시면 교육 요일과 시간을 안내드립니다.',
  },
  {
    id: 'f8',
    question: '주차가 가능한가요?',
    template:
      '주차 공간·요금 및 오시는 길은 방문 전 확인이 필요합니다. 대표전화(042-524-4181)로 문의해 주시고, 가급적 대중교통 이용을 권해드립니다.',
    fallback:
      '주차 공간·요금 및 오시는 길은 방문 전 확인이 필요합니다. 대표전화(042-524-4181)로 문의해 주시고, 가급적 대중교통 이용을 권해드립니다.',
  },
  {
    id: 'f9',
    question: '강의실은 어디인가요?',
    template: '{name} 과정 강의실은 {room} 입니다.',
    fallback: '과정을 선택하시면 강의실 위치를 안내드립니다.',
  },
  {
    id: 'f10',
    question: '취업지원도 받을 수 있나요?',
    template:
      '{name} 수료생은 대전여성새로일하기센터를 통해 취업상담·알선, 새일여성인턴제 등 취업지원을 받으실 수 있습니다.',
    fallback:
      '수료생은 대전여성새로일하기센터를 통해 취업상담·알선, 새일여성인턴제 등 취업지원을 받으실 수 있습니다.',
  },
  {
    id: 'f11',
    question: '담당자가 누구인가요?',
    template:
      '{name} 과정은 {dept} 담당입니다. 담당자 직접 연결·확인은 대표전화(042-524-4181)로 안내드리겠습니다.',
    fallback:
      '과정을 선택하시면 담당 부서를 안내드립니다. 담당자 연결은 대표전화(042-524-4181)로 도와드립니다.',
  },
  {
    id: 'f12',
    question: '중간에 수강 신청할 수 있나요?',
    template: '{name} 과정의 중도 등록 가능 여부는 담당자 확인이 필요합니다. 확인 후 안내드리겠습니다.',
    fallback: '중도 등록 가능 여부는 과정 진행 상황에 따라 달라 담당자 확인이 필요합니다.',
  },
  {
    id: 'f13',
    question: '무엇을 배우나요? (교육내용)',
    template: '{name} 과정 교육내용: {curriculum}',
    fallback: '과정을 선택하시면 교육내용을 안내드립니다. 세부 커리큘럼은 담당자 확인이 필요할 수 있습니다.',
  },
  {
    id: 'f14',
    question: '준비물이 있나요?',
    template: '{name} 과정 준비물: {materials}',
    fallback: '과정에 따라 준비물이 다릅니다. 문의 과정을 선택해 주세요.',
  },
  {
    id: 'f15',
    question: '환불 규정이 어떻게 되나요?',
    template: '{name} 과정 환불 안내: {refundPolicy}',
    fallback:
      '개강 전 취소 시 전액 환불되며, 개강 후에는 수강 일수 기준으로 환불됩니다. 국비지원 과정은 별도 규정이 적용되어 담당자 확인이 필요합니다.',
  },
]
