# Learningmate

## 프로젝트 설명

Learningmate 프로젝트의 아티클, 퀴즈 생성 작업을 하는 워커 프로세스 입니다.

## 프로젝트 구조

```text
src/
├── ai/                      # AI 서비스 모듈
│   ├── ai.service.ts        # AI 제공자 추상화 (Gemini, OpenAI, xAI)
│   ├── ai.module.ts
│   └── types/               # AI 관련 타입 정의
│
├── batch/                   # 배치 작업 핵심 모듈
│   ├── batch.consumer.ts    # BullMQ 작업 소비자
│   ├── batch.service.ts     # 콘텐츠 생성 오케스트레이터
│   ├── batch.module.ts
│   ├── brave-search.service.ts  # Brave 검색 API 연동
│   ├── crawling.service.ts  # 웹 크롤링 및 텍스트 추출
│   ├── bm25.service.ts      # BM25 문서 랭킹 알고리즘
│   ├── prompts/             # AI 프롬프트 템플릿
│   │   ├── create-concept-prompts.ts
│   │   ├── create-example-prompts.ts
│   │   ├── create-related-words-prompts.ts
│   │   ├── create-importace-prompts.ts
│   │   ├── create-exploration-prompts.ts
│   │   ├── create-summary-prompts.ts
│   │   └── create-quizzes-propmts.ts
│   ├── schemas/             # Zod 스키마 정의
│   └── types/               # 배치 관련 타입 정의
│
├── prisma/                  # Prisma 클라이언트 모듈
│   ├── prisma.service.ts    # Prisma 서비스
│   └── prisma.module.ts
│
├── config/                  # 설정 관련
│   └── validate-env.ts      # 환경 변수 검증
│
├── constants/               # 상수 정의
│   ├── batch-options.ts     # BullMQ 설정
│   ├── error-message.ts     # 에러 메시지
│   └── env-keys.ts          # 환경 변수 키
│
├── utils/                   # 유틸리티 함수
│   └── fetch-with-timeout.ts
│
├── worker.module.ts         # 메인 워커 모듈
└── main.ts                  # 애플리케이션 진입점
```

## 주요 컴포넌트

### 1. BatchConsumer (`src/batch/batch.consumer.ts`)

- **BullMQ** 큐에서 작업을 수신하고 처리
- 작업 완료/실패 이벤트 처리
- `BatchService`로 작업 라우팅

### 2. BatchService (`src/batch/batch.service.ts`)

- 콘텐츠 생성 파이프라인 전체 조정
- 중복 생성 방지 (기존 콘텐츠 확인)
- 검색부터 DB 저장까지 전 과정 관리
- 트랜잭션을 통한 원자적 DB 작업

### 3. BraveSearchService (`src/batch/brave-search.service.ts`)

- **Brave Search API**를 통한 키워드 검색

### 4. CrawlingService (`src/batch/crawling.service.ts`)

- 검색 결과 URL 크롤링
- `robots.txt` 준수
- **cheerio**를 사용한 텍스트 추출
- 노이즈 제거 (스크립트, 스타일, 네비게이션 등)

### 5. BM25Service (`src/batch/bm25.service.ts`)

- 크롤링된 문서의 키워드 관련성 순위 매김
- AI 프롬프트에 사용할 가장 관련성 높은 콘텐츠 선택

### 6. AiService (`src/ai/ai.service.ts`)

- AI 제공자 추상화 계층
- 지원 모델:
  - Google Gemini (gemini-2.5-flash)
- Zod 스키마를 통한 구조화된 출력 생성

## AI 기반 아티클 및 퀴즈 생성 파이프라인

1. **데이터 수집**
   - **Brave Search API**를 통해 키워드 관련 검색 결과 수집
   - 한국어 콘텐츠 우선 필터링 (country=KR, search_lang=ko)

2. **콘텐츠 크롤링 및 추출**
   - `robots.txt` 준수 여부 확인 (1시간 캐싱)
   - **Cheerio** 라이브러리로 HTML 파싱 및 본문 텍스트 추출
   - 불필요한 요소 제거 (스크립트, 스타일, 네비게이션, 광고 등)
   - 최소 30자 이상의 텍스트 블록만 수집

3. **문서 청킹 및 관련 문서 선별**
   - 1000자 초과 문서는 문장 단위로 800자 기준 청킹
   - **BM25 알고리즘**으로 키워드 관련도 점수 계산
   - 상위 10개 문서/청크를 AI 프롬프트 컨텍스트로 선정

4. **AI 아티클 생성**
   - 사용 모델: **Gemini 2.5 Flash**
   - 5가지 타입의 아티클 병렬 생성:
     - 개념 (concept)
     - 예시 (example)
     - 관련 용어 (related-words)
     - 중요성 (importance)
     - 탐구 주제 (exploration)
   - 각 아티클마다 요약 생성

5. **AI 퀴즈 생성**
   - 각 아티클의 내용을 기반으로 퀴즈 생성
   - 구조화된 스키마(Zod)를 통한 데이터 검증

6. **데이터베이스 저장**
   - 트랜잭션을 통한 원자적 저장
   - 중복 생성 방지 로직 (기존 콘텐츠 확인)
