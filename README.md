# Rebot — 사장님용 CRM 대시보드

카페·베이커리용 디지털 스탬프 서비스 **리봇(Rebot)**의 사장님 전용 관리 대시보드입니다.  
고객 스탬프 현황, 이탈 위험 분석, AI 메시지 생성, SNS 콘텐츠 초안 작성을 한 화면에서 처리합니다.

## 주요 기능

- **고객 현황** — 전체 단골 목록, 스탬프 수·방문일 기준 이탈 위험도(safe / watch / danger / churned) 자동 분류
- **AI 메시지 생성** — 이탈 위험 고객에게 보낼 맞춤 문자 초안을 AI로 생성 (OpenRouter → Gemini → 템플릿 폴백)
- **SNS 콘텐츠 작성** — 인스타그램·네이버 블로그·카카오 채널용 게시글 AI 초안 생성
- **방문 기록** — 고객별 방문 로그 및 수동 방문 등록
- **실시간 Supabase 연동** — 고객용 앱과 동일 DB 공유, 스탬프 적립 즉시 반영

## 기술 스택

- **Frontend** — React 19, TypeScript, Vite 6, Tailwind CSS v4
- **Backend** — Express.js (API + SPA fallback)
- **Database** — Supabase (PostgreSQL), service_role key로 RLS 우회
- **AI** — OpenRouter (`google/gemini-2.0-flash-lite`) → Gemini SDK → 템플릿 폴백
- **아이콘** — Lucide React

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env 파일 생성)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENROUTER_API_KEY=your-openrouter-key   # 선택
GEMINI_API_KEY=your-gemini-key           # 선택

# 3. 개발 서버 실행 (포트 3000, API 포함)
npm run dev
```

## 프로젝트 구조

```
src/
├── lib/
│   ├── supabase.ts       # Supabase 클라이언트 싱글턴
│   ├── db-server.ts      # 전체 DB 작업 (Supabase 비동기)
│   ├── api-handlers.ts   # REST API 핸들러
│   ├── ai-server.ts      # AI 메시지·게시글 생성
│   ├── openrouter.ts     # OpenRouter API 클라이언트
│   ├── prompts.ts        # AI 프롬프트 빌더
│   ├── churn.ts          # 이탈 위험도 계산 (last_visit_at 기준)
│   └── phone.ts          # 전화번호 마스킹
├── components/
│   ├── CustomerTable.tsx  # 단골 목록 + 이탈 단계 배지
│   ├── MessageList.tsx    # AI 메시지 초안 관리
│   ├── ActivityFeed.tsx   # 방문 로그
│   ├── DashboardCards.tsx # 핵심 KPI 카드
│   ├── ContentEditor.tsx  # SNS 콘텐츠 편집기
│   ├── PerformanceCard.tsx
│   ├── PostPreview.tsx
│   ├── QRPreview.tsx
│   ├── Sidebar.tsx
│   └── BottomNav.tsx
├── types/index.ts         # 전체 타입 정의
└── App.tsx
server.ts                  # 프로덕션 Express 서버
vite.config.ts             # Vite + 인라인 API 플러그인 (dev)
```

## DB 스키마

| 테이블 | 주요 컬럼 |
|---|---|
| `stores` | store_code, store_name, stamp_goal, reward_desc, message_signature |
| `customers` | store_id, phone, current_stamps, total_stamps, last_visit_at, marketing_consent |
| `visit_logs` | customer_id, store_id, visited_at, stamps_earned, source |
| `messages` | store_id, customer_id, churn_stage, content, status |
| `content_drafts` | store_id, channel, content, hashtags, status |

> `current_stamps`: 현재 카드 스탬프 수 (리워드 달성 시 0으로 리셋)  
> `churn_stage`: DB에 저장하지 않고 `last_visit_at` 기준 런타임 계산

## API 엔드포인트

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/store/:storeCode` | 매장 정보 |
| `GET` | `/api/customers/:storeCode` | 단골 목록 |
| `POST` | `/api/stamp/:storeCode` | 스탬프 적립 |
| `POST` | `/api/ai/message` | AI 메시지 생성 |
| `POST` | `/api/ai/post` | AI 게시글 생성 |

## 관련 레포

- [고객용 스탬프 앱](https://github.com/kjin618-rgb/Rebot-App-Customer-facing-page) — 고객 QR 스캔 접점, 동일 Supabase 프로젝트 공유
