# Rebot — 사장님용 CRM 대시보드

카페·베이커리용 디지털 스탬프 서비스 **리봇(Rebot)**의 사장님 전용 관리 대시보드입니다.  
고객 스탬프 현황, 이탈 위험 분석, AI 메시지 생성, SNS 콘텐츠 초안 작성을 한 화면에서 처리합니다.

> **배포 상태**: 로컬 API 검증 완료 · Vercel 재배포 필요  
> **상세 이력**: [`DEV_SPEC.md`](./DEV_SPEC.md) 참고

---

## 주요 기능

- **고객 현황** — 전체 단골 목록, 스탬프 수·방문일 기준 이탈 위험도 자동 분류  
  (`safe` ≤14일 / `watch` 15-30일 / `danger` 31-60일 / `churned` >60일)
- **AI 메시지 생성** — 이탈 고객 맞춤 문자 초안 AI 생성 (OpenRouter → Gemini → 템플릿 폴백)
- **SNS 콘텐츠** — 인스타그램·네이버·카카오 채널용 게시글 AI 초안 생성
- **방문 기록** — 고객별 방문 로그 및 수동 방문 등록
- **Supabase 연동** — 고객용 앱과 동일 DB 공유, 스탬프 적립 즉시 반영

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| 서버리스 API | Vercel Serverless Function (`api/handler.ts`) |
| 로컬 서버 | Express.js (`server.ts`) |
| Database | Supabase (PostgreSQL), service_role 키 |
| AI | OpenRouter `google/gemini-2.0-flash-lite` → Gemini SDK → 템플릿 폴백 |

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에 아래 값 입력

# 3-A. Vite 개발 서버만 (UI 확인용)
npm run dev

# 3-B. Express 서버 (API + UI 포함)
npm run start
```

### 필수 환경 변수

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 선택 환경 변수 (AI 기능)

```env
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=AIza...
```

---

## Vercel 배포

### 환경 변수 등록 (필수)

Vercel 프로젝트 → Settings → Environment Variables:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 배포 구조

```
빌드: npm run build (vite build)
프론트엔드 출력: dist/
API 함수: api/handler.ts → Vercel 서버리스 함수로 자동 인식
라우팅:
  /api/* → api/handler.ts
  그 외  → dist/index.html (SPA)
```

---

## 프로젝트 구조

```
api/
└── handler.ts          # Vercel 서버리스 함수 (모든 API 라우팅)
src/
├── lib/
│   ├── supabase.ts     # Supabase 클라이언트 싱글턴
│   ├── db-server.ts    # DB CRUD (서버 전용)
│   ├── api-handlers.ts # REST API 라우팅 로직
│   ├── ai-server.ts    # AI 생성 로직 (서버 전용)
│   ├── openrouter.ts   # OpenRouter 클라이언트
│   ├── prompts.ts      # AI 프롬프트 빌더
│   ├── churn.ts        # 이탈 단계 계산
│   └── phone.ts        # 전화번호 마스킹
├── components/         # React UI 컴포넌트
├── types/index.ts      # 전체 타입 정의
└── App.tsx
server.ts               # 로컬 Express 서버
vercel.json             # Vercel 배포 설정
```

---

## DB 스키마

| 테이블 | 주요 컬럼 |
|---|---|
| `stores` | `store_code`, `store_name`, `stamp_goal`, `reward_desc`, `message_signature` |
| `customers` | `store_id`, `phone`, `current_stamps`, `total_stamps`, `last_visit_at`, `marketing_consent` |
| `visit_logs` | `customer_id`, `store_id`, `visited_at`, `stamps_earned`, `source` |
| `messages` | `store_id`, `customer_id`, `churn_stage`, `content`, `status` |
| `content_drafts` | `store_id`, `channel`, `content`, `hashtags`, `status` |

> `churn_stage`는 DB에 저장하지 않고 `last_visit_at` 기준 런타임 계산

---

## MVP 데이터 조회

현재 MVP는 `store_code`로 매장을 찾고, 연결된 `store_id` 기준으로 고객·메시지·콘텐츠 데이터를 표시합니다.

Phase 2에서:
- 매장별 로그인/인증 추가
- 각 사장님이 자기 매장 데이터만 열람 가능하도록 수정

---

## 관련 레포

- **고객용 스탬프 앱**: https://github.com/kjin618-rgb/Rebot-App-Customer-facing-page  
  동일 Supabase 프로젝트 공유 · `store_code`로 매장 식별
