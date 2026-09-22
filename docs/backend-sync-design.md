# 교육과정 자동 동기화 백엔드 설계 (Node 단일 서버)

> 목적: djjob.or.kr(대전여성인력개발센터)의 교육과정 정보를 **사람 개입 없이 주기적으로** 최신화하여
> 전화응대 앱에 제공한다. 기존 `npm run sync`(수동)의 자동화 버전.
> 방식: **Express 단일 서버 1개** — 자동 주기 갱신 + 수동 즉시 갱신 + 정적 앱 서빙을 한 프로세스에서 처리.
> 상태: **✅ 구현 완료** (`server/`, `src/hooks/useCourses.ts`, `src/api/courses.ts`). 실행: `npm run start`.
> 자동시작 배포는 `docs/deploy-pm2.md` 참고.

---

## 1. 아키텍처

```
   djjob.or.kr                ┌──────────── Node 서버 (프로세스 1개) ────────────┐
  (원본 사이트)                │                                                   │
      ▲   │ 서버가 대신 요청     │   node-cron (6h)  →  scraper.scrapeCourses()      │
      │   └───── scrape ───────▶                              │                    │
      │        (서버→외부라        │                          ▼                    │
      │         CORS 없음)        │                    캐시: courses.json + 메모리   │
      │                          │                          │                     │
      │                          │   Express:  GET /api/courses  (캐시 반환)        │
      │                          │             POST /api/refresh (즉시 재크롤)       │
      │                          │             GET  /api/health                    │
      │                          │             GET  /*  → 정적 React 빌드(dist)      │
      │                          └───────────────────────┬─────────────────────────┘
      │                                                  │ 같은 오리진(CORS 불필요)
      │                                                  ▼
      └──────────────────────────────────────  React 앱 (브라우저)
                                        시작 시 GET /api/courses → 실패 시 번들 스냅샷 폴백
```

핵심 원칙
- **단일 오리진**: 서버가 React 정적 파일과 API를 같이 서빙 → 브라우저 CORS 문제 원천 제거.
- **읽기 전용 프록시**: 서버는 공개 교육과정 데이터만 취급. 개인정보(전화 메모)는 서버로 보내지 않음.
- **항상 뜨는 앱**: 백엔드가 죽어도 프런트는 빌드에 포함된 스냅샷으로 동작.

---

## 2. 폴더 구조 (추가/변경 예정)

```
ywca/
├── src/                         # (기존) React 앱
│   ├── data/courses.ts          #  → 빌드시 폴백 스냅샷으로 유지
│   └── hooks/useCourses.ts      #  ★신규: /api/courses fetch + 폴백
├── scripts/
│   └── sync-courses.mjs         #  → scraper 로직을 server 와 공유하도록 리팩터
├── server/                      #  ★신규 백엔드
│   ├── index.mjs                #  Express 엔트리 (~70줄)
│   ├── scraper.mjs              #  scrapeCourses(): Course[]  (sync 로직 이관)
│   ├── store.mjs               #  캐시 로드/저장 (courses.json + 메모리)
│   └── scheduler.mjs           #  node-cron 주기 실행
└── data/
    └── courses.json             #  ★런타임 캐시(마지막 성공본). git-ignore
```

> **리팩터 포인트**: 지금 `sync-courses.mjs` 안의 크롤/파싱 로직을 `server/scraper.mjs`의
> `export async function scrapeCourses(): Promise<Course[]>` 로 분리하고,
> CLI(`npm run sync`)와 서버가 **같은 함수**를 재사용한다. (단일 소스, 파싱 규칙 이중관리 방지)

---

## 3. API 명세

| 메서드 | 경로 | 응답 | 용도 |
|---|---|---|---|
| GET | `/api/courses` | `{ updatedAt, count, stale, courses: Course[] }` | 앱 시작 시 로드 (캐시라 즉시) |
| POST | `/api/refresh` | `{ updatedAt, count, courses }` 또는 `409` | "지금 갱신" 버튼 (rate-limit) |
| GET | `/api/health` | `{ ok, lastSync, lastError, ageMinutes }` | 모니터링/상태 표시 |

응답 예시
```json
// GET /api/courses
{
  "updatedAt": "2026-09-22T08:00:12+09:00",
  "count": 29,
  "stale": false,          // true = 마지막 크롤 실패로 과거 데이터 제공 중
  "courses": [ { "id": "c1", "name": "…", "enrolled": 10, "capacity": 15, … } ]
}
```

---

## 4. 동작 시나리오

**정상 자동 갱신**
1. 서버 기동 → 즉시 1회 `scrapeCourses()` → `courses.json` + 메모리 캐시 채움.
2. `node-cron`이 **6시간마다**(설정값) 재크롤 → 성공 시 캐시 교체 + `updatedAt` 갱신.
3. 프런트는 `GET /api/courses`로 캐시만 읽음(빠름). 새로고침 시 최신 반영.

**수동 즉시 갱신**
- 데스크 직원이 앱의 **"지금 갱신"** 클릭 → `POST /api/refresh` → 재크롤 후 즉시 반환.
- 남용 방지 위해 **최소 간격 rate-limit**(예: 60초). 진행 중이면 `409`.

**원본 사이트 장애**
- 크롤 실패 시 **캐시를 버리지 않고 마지막 성공본을 계속 제공**, `stale: true` + `lastError` 기록.
- 프런트는 상단바에 "⚠ 마지막 동기화: 9/21 08:00 (갱신 지연)" 노란 배지 표시.

**백엔드 자체 다운**
- 프런트 `GET /api/courses` 실패 → **빌드에 포함된 `src/data/courses.ts` 스냅샷**으로 폴백. 앱은 정상 동작(데이터만 조금 오래됨).

---

## 5. 프런트엔드 연동 변경점 (최소)

- **`useCourses()` 훅 신설**: 앱 마운트 시 `/api/courses` fetch.
  - 성공 → 서버 데이터 사용.
  - 실패/타임아웃(예: 2s) → `import { COURSES }` 번들 스냅샷 사용.
- `App.tsx`가 `COURSES`를 직접 import하던 것을 `const { courses, updatedAt, stale, refresh } = useCourses()` 로 교체.
  - `COURSE_BY_ID`, `useCourseSearch`, `TodayBoard` 등은 courses 배열을 **인자/props로** 받도록 소폭 조정.
- 상단바에 **"마지막 동기화 시각 + [지금 갱신] 버튼"** 추가.
- 전화 메모 기능은 **변경 없음**(계속 localStorage).

---

## 6. 설정 (환경변수)

| 변수 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `8080` | 서버 포트 |
| `SYNC_CRON` | `0 */6 * * *` | 자동 크롤 주기(6시간) |
| `SYNC_ON_BOOT` | `true` | 기동 시 1회 크롤 |
| `REFRESH_MIN_INTERVAL_SEC` | `60` | 수동 갱신 최소 간격 |
| `SOURCE_BASE` | `https://www.djjob.or.kr` | 원본 사이트(변경 대비) |

---

## 7. 배포 (always-on 필요)

단일 Node 프로세스라 어디서든 구동 가능. 후보:

| 위치 | 장점 | 유의점 |
|---|---|---|
| **센터 내부 PC/서버** | 추가 비용 0, 내부망에서 빠름 | 그 PC가 켜져 있어야 함. 자동시작 등록(작업 스케줄러/pm2) |
| **저가 클라우드**(Render/Railway/Fly 무료·저가 티어) | 관리 편함, 외부 접속 | 월 소액 비용, 무료 티어는 슬립 가능 |
| **소형 VM**(오라클 무료 등) | 완전 제어 | 초기 셋업 필요 |

권장: 우선 **센터 PC에서 pm2로 상시 구동**(무비용) → 필요 시 클라우드로 이전.

프로세스 관리 예시(추후): `pm2 start server/index.mjs --name ywca --cron-restart 없음`, OS 부팅 시 자동 실행 등록.

---

## 8. 보안·개인정보

- 서버는 **공개 교육정보만** 크롤·제공 → 민감정보 없음.
- `POST /api/refresh` 외에 쓰기 엔드포인트 없음. refresh는 rate-limit로 남용 차단.
- 전화 메모(개인정보)는 **서버로 전송하지 않고 브라우저 localStorage 유지** → 기획서 15장 준수.
- 외부 노출 시 기본 조치: HTTPS(리버스 프록시), 필요하면 내부망 한정 또는 간단 접근제한.

---

## 9. 의존성 (추가 예정, 최소)

- `express` — 정적 서빙 + API
- `node-cron` — 주기 스케줄 (또는 의존성 없이 `setInterval`로 대체 가능)
- 스크래핑은 **Node 내장 `fetch` + 정규식 파서**(현재 sync 방식) 그대로 → HTML 파서 라이브러리 불필요.

---

## 10. 추후 구현 순서 (착수 시)

1. `sync-courses.mjs`의 크롤·파싱을 `server/scraper.mjs`의 `scrapeCourses()`로 분리, CLI가 이를 재사용.
2. `server/store.mjs`(캐시 로드/저장) + `server/scheduler.mjs`(cron) 작성.
3. `server/index.mjs`: Express로 `/api/*` + `dist` 정적 서빙.
4. 프런트 `useCourses()` 훅 + 상단바 "마지막 동기화/지금 갱신" UI.
5. `App.tsx` 및 관련 컴포넌트를 courses 주입 방식으로 소폭 리팩터.
6. 검증: 서버 기동→ /api/courses, /api/refresh, 사이트 차단 시 stale 동작, 백엔드 down 시 프런트 폴백.
7. 배포: 센터 PC pm2 상시구동 + 자동시작 등록.

**예상 규모**: 백엔드 ~150줄 + 프런트 소폭 수정. 1~2회 작업 분량.

---

## 11. 이 설계가 주는 것 / 안 주는 것

- ✅ 사람 개입 없이 6시간마다 자동 최신화, 필요 시 원클릭 즉시 갱신.
- ✅ 원본/백엔드 장애에도 앱이 죽지 않음(폴백·stale 표시).
- ✅ 개인정보는 여전히 로컬 저장.
- ⚠️ "완전 자동"의 전제는 **서버가 상시 떠 있어야 함**(센터 PC 또는 클라우드).
- ⛔ 실시간 초단위 반영은 대상 아님(원본이 그렇게 자주 바뀌지 않음). 6시간 주기면 충분.
