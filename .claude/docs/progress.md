# Progress Log

## [2026-02-05 12:00] 세션 작업 내역

### 변경된 파일

#### BE 스킬 정리
- `.claude/skills/BE-CRUD/SKILL.md`: 프로젝트 구조 반영, references 링크 수정
- `.claude/skills/BE-CRUD/references/*.md`: 4개 파일 간결화, 실제 구조에 맞게 수정
- `.claude/skills/BE-DEBUG/SKILL.md`: 신규 작성
- `.claude/skills/BE-DEBUG/references/*.md`: 4개 파일 신규 생성 (에러 유형별)
- `.claude/skills/BE-refactor/SKILL.md`: 오타 수정, 구조 정리
- `.claude/skills/BE-refactor/references/patterns.md`: 불필요 내용 제거
- `.claude/skills/BE-TEST/SKILL.md`: 간결화, references 분리
- `.claude/skills/BE-TEST/references/*.md`: 3개 파일 신규 생성

#### FE 스킬 정리
- `.claude/skills/FE-CRUD/SKILL.md`: 신규 작성
- `.claude/skills/FE-CRUD/references/*.md`: 4개 파일 신규 생성
- `.claude/skills/FE-page/SKILL.md`: 구조 정리, agent 필드 추가
- `.claude/skills/FE-page/references/*.md`: 3개 파일 신규 생성
- `.claude/skills/FE-api/SKILL.md`: 구조 정리, agent 필드 추가
- `.claude/skills/FE-api/references/*.md`: 3개 파일 신규 생성

#### Agent 파일 수정
- `.claude/agents/be-agent.md`: skills 목록 대소문자 일치, 빈 섹션 작성
- `.claude/agents/fe-agent.md`: skills 목록 수정, 존재하지 않는 스킬 제거

### 작업 요약
- BE 스킬 4개 (CRUD, DEBUG, refactor, TEST) 구조 통일 및 references 분리
- FE 스킬 3개 (CRUD, page, api) 구조 통일 및 references 분리
- be-agent, fe-agent와 스킬 매칭 검증 및 수정
- 모든 스킬 파일 간결화 및 실제 프로젝트 구조 반영

---

## [2026-02-05 12:30] CLAUDE.md 최신화

### 변경된 파일
- `CLAUDE.md`: 에이전트 테이블 최신화, db-agent 제거

### 작업 요약
- db-agent 관련 내용 제거
- be-agent skills: BE-CRUD, BE-refactor, BE-TEST, BE-DEBUG 반영
- fe-agent skills: FE-CRUD, FE-page, FE-api 반영
- 작업 순서 3단계 → 2단계 (BE → FE)

---

## [2026-02-10 10:52] Feature 1 구현 완료

### 변경된 파일

#### Backend
- `backend/app/utils/__init__.py`: 신규 생성 (utils 패키지 초기화)
- `backend/app/utils/security.py`: 비밀번호 해싱/검증 함수 (bcrypt)
- `backend/app/models/user.py`: User 모델 (SQLAlchemy ORM)
- `backend/app/models/__init__.py`: User import 추가
- `backend/app/schemas/user.py`: UserCreate, UserLogin, UserResponse 스키마
- `backend/app/schemas/__init__.py`: User 스키마 export 추가
- `backend/app/main.py`: User 모델 import 추가
- `backend/requirements.txt`: passlib[bcrypt], pydantic[email] 추가
- `backend/app.db`: SQLite 데이터베이스 (users 테이블 자동 생성)

#### Frontend
- `frontend/src/types/user.ts`: User, LoginRequest, RegisterRequest 타입
- `frontend/src/lib/api.ts`: 공통 API 호출 함수
- `frontend/src/lib/auth.ts`: 회원가입/로그인 API 함수
- `frontend/src/app/register/page.tsx`: 회원가입 페이지
- `frontend/src/app/login/page.tsx`: 로그인 페이지
- `frontend/src/app/page.tsx`: 홈 페이지 (회원가입/로그인 버튼 추가)

#### 문서
- `.claude/docs/login_todo.md`: 로그인 기능 개발 TODO (9개 Feature)
- `.claude/docs/dev.md`: Feature 1 구현 가이드
- `.claude/docs/test.md`: Feature 1 테스트 결과

### 작업 요약
- **Feature 1: 사용자 데이터 모델 및 인증 스키마 설계** 완료
- User 모델 (email, username, hashed_password, 타임스탬프)
- Pydantic 스키마 (입력 검증: 이메일 형식, 비밀번호 8자 이상)
- bcrypt 비밀번호 해싱 (보안)
- TypeScript 타입 정의 (백엔드 스키마와 1:1 대응)
- 회원가입/로그인 UI 페이지 구현 (보너스)
- GitHub repository 생성: https://github.com/merman9576/module_4_3

---

## [2026-02-10 14:30] 시스템 메트릭 모니터링 구현 완료

### 변경된 파일

#### Backend
- `backend/app/routers/metrics.py`: 메트릭 API 라우터 (125줄)
  - GET /api/metrics/cpu - CPU 사용률, 코어 수, 주파수
  - GET /api/metrics/memory - 메모리 사용률, 가용/전체 메모리
  - GET /api/metrics/disk - 디스크 사용률, 남은/전체 용량
  - GET /api/metrics/network - 네트워크 송수신 바이트, 패킷 수
- `backend/app/schemas/metrics.py`: 메트릭 스키마 (77줄)
  - CPUMetrics, MemoryMetrics, DiskMetrics, NetworkMetrics
- `backend/app/main.py`: metrics 라우터 등록
- `backend/requirements.txt`: psutil==5.9.8 추가

#### Frontend
- `frontend/src/types/metrics.ts`: TypeScript 타입 정의 (39줄)
  - MetricDataPoint (timestamp, value, rawValue)
  - CPUMetrics, MemoryMetrics, DiskMetrics, NetworkMetrics
- `frontend/src/components/MetricsChart.tsx`: 재사용 그래프 컴포넌트 (103줄)
  - Recharts LineChart 사용
  - Peak 시점 자동 감지 및 빨간 점 표시
  - ReferenceDot으로 peak 위치 표시
- `frontend/src/app/metrics/page.tsx`: 메인 대시보드 (400+줄)
  - 5개 메트릭 실시간 모니터링 (CPU, Memory, Disk, Network Sent/Recv)
  - 폴링 간격 선택 (5초, 10초, 30초, 60초)
  - 시간 범위 선택 (30분 ~ 24시간, 30분 단위)
  - 24시간 히스토리 (LocalStorage 영속성)
  - Network Delta 계산 (누적 값 → 증가량)
- `frontend/src/app/page.tsx`: "📊 System Metrics" 링크 추가
- `frontend/package.json`: recharts 추가

#### Kernel Module (선택적)
- `kernel/network_monitor/network_monitor.c`: Netfilter 모듈 (501줄)
  - TCP/UDP 포트별 패킷/바이트 통계 수집
  - /proc/net/traffic_stats JSON 인터페이스
  - Hash table 기반 데이터 구조
- `kernel/network_monitor/Makefile`: 빌드 설정
- `kernel/network_monitor/README.md`: 상세 문서
- `kernel/network_monitor/.gitignore`: 빌드 파일 제외
- `kernel/README.md`: 커널 모듈 개발 가이드

#### Documentation
- `.claude/docs/function-system-metric-monitor.md`: 구현 결과 문서 (850줄)
  - 아키텍처, API 명세, 구현 상세
  - 실행 방법, 테스트 가이드
  - 성능 최적화, 향후 개선 사항
- `.claude/skills/function-system-metric-monitor/`: 기능 스킬 정의

### 작업 요약
- ✅ **4개 메트릭 실시간 모니터링**: CPU, Memory, Disk, Network
- ✅ **폴링 간격 선택**: 5초 ~ 60초 (사용자 조정 가능)
- ✅ **시간 범위 선택**: 30분 ~ 24시간 (30분 단위, 17개 옵션)
- ✅ **24시간 히스토리**: LocalStorage 영속성, 최대 17,280 포인트
- ✅ **Peak 시점 표시**: 빨간 점(🔴) + 시간/값 라벨
- ✅ **Network Delta 계산**: 누적 값 → 폴링 간격당 증가량 (MB/5s)
- ✅ **송신/수신 분리**: Network Sent/Recv 별도 차트
- ✅ **Netfilter 커널 모듈**: 패킷 레벨 모니터링 (코드 완성, Linux 배포 대기)
- ✅ **반응형 UI**: Recharts + Tailwind CSS
- ✅ **에러 처리**: API 실패 시 에러 메시지 표시

### 기술 스택
- **Backend**: FastAPI + psutil (시스템 정보 수집)
- **Frontend**: Next.js 14 + TypeScript + Recharts + Tailwind CSS
- **Kernel**: Netfilter hooks (PRE_ROUTING, POST_ROUTING)
- **데이터**: LocalStorage (클라이언트 사이드 영속성)

### API 엔드포인트
```
GET /api/metrics/cpu      - CPU 사용률
GET /api/metrics/memory   - 메모리 사용률
GET /api/metrics/disk     - 디스크 사용률
GET /api/metrics/network  - 네트워크 I/O
```

### UI 레이아웃
```
┌─────────────────────────────────────────────────┐
│ [폴링: ▼ 5초] [시간 범위: ▼ 2시간]              │
├──────────────────────┬──────────────────────────┤
│ CPU (%) 🔴 Peak      │ Memory (%) 🔴 Peak       │
├──────────────────────┼──────────────────────────┤
│ Disk (%) 🔴 Peak     │ Network Sent 🔴 Peak     │
├──────────────────────┼──────────────────────────┤
│ Network Recv 🔴 Peak │                          │
└──────────────────────┴──────────────────────────┘
```

---

## [2026-02-10 15:30] Network Delta 계산 및 마우스 휠 기능 추가

### 변경된 파일

#### Frontend
- `frontend/src/types/metrics.ts`: MetricDataPoint에 rawValue 필드 추가
- `frontend/src/app/metrics/page.tsx`: 주요 변경
  - Network Delta 계산 로직 추가 (누적 값 → 증가량)
  - Network Sent/Recv 한 그래프에 통합 표시
  - 마우스 휠 이벤트 핸들러 추가 (시간축 확대/축소)
  - 의존성 배열 수정으로 휠 이벤트 버그 수정
- `frontend/src/components/MetricsChart.tsx`: 다중 라인 지원
  - data2, color2, dataKey1, dataKey2 props 추가
  - 두 데이터셋 병합 로직 (mergedData)
  - 각 라인별 Peak 계산 및 표시

#### Documentation
- `.claude/skills/function-system-metric-monitor/SKILL.md`:
  - 마우스 휠 기능 설명 추가
  - 완료 조건 체크리스트 업데이트 (모두 완료)
- `.claude/docs/function-system-metric-monitor.md`:
  - 마우스 휠 확대/축소 섹션 추가
  - 개발 히스토리 업데이트 (3개 항목 추가)
  - 완료 조건 체크리스트 확장

### 작업 요약
- ✅ **Network Delta 계산**: 누적 값 → 폴링 간격당 증가량 (MB/5s)
  - rawValue에 누적 값 저장
  - 이전 측정값과 비교하여 delta 계산
  - 음수 방지 로직 (Math.max(0, ...))
- ✅ **Network Sent/Recv 통합**: 한 그래프에 두 선 표시
  - Sent: 빨간색 (#ef4444)
  - Recv: 파란색 (#3b82f6)
  - 각 라인별 Peak 표시 (position 분리)
  - 총 4개 차트로 정리 (2x2 그리드)
- ✅ **마우스 휠 확대/축소**: 그래프 영역에서 시간축 조절
  - 휠 위로: 시간 범위 30분씩 축소 (확대)
  - 휠 아래로: 시간 범위 30분씩 확장 (축소)
  - 범위 제한: 최소 30분 ~ 최대 24시간
  - 드롭다운과 자동 동기화
  - 이벤트 리스너 버그 수정 (의존성 배열)
- ✅ **MetricsChart 컴포넌트 확장**: 다중 라인 지원
  - 선택적 두 번째 라인 (data2)
  - 두 데이터셋 timestamp 기준 병합
  - 각 라인별 Peak 자동 계산

---

## 다음 스텝
- [x] Feature 1: 사용자 모델 및 스키마 구현
- [x] 시스템 메트릭 모니터링 구현 완료
  - [x] CPU, Memory, Disk, Network 모니터링
  - [x] 폴링 간격 선택 (5초~60초)
  - [x] 시간 범위 선택 (30분~24시간, 30분 단위)
  - [x] 마우스 휠 확대/축소
  - [x] Peak 시점 표시
  - [x] Network Delta + Sent/Recv 통합
  - [x] 24시간 히스토리 + LocalStorage
- [ ] Feature 2: 회원가입 API 엔드포인트 (POST /api/auth/register)
- [ ] Feature 3: 로그인 API + JWT 토큰 발급
- [ ] Feature 4: 인증 미들웨어
- [ ] 메트릭 알림 기능 (임계값 초과 시)
- [ ] 프로세스별 모니터링
- [ ] 커널 모듈 Linux 서버 배포
