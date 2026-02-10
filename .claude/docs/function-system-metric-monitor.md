# System Metrics Monitor - 구현 결과 문서

## 📋 개요

실시간 시스템 메트릭(CPU, Memory, Disk, Network) 모니터링 웹 애플리케이션

### 주요 기능
- ✅ 4개 메트릭 실시간 모니터링 (4등분 그래프)
- ✅ 폴링 간격 선택 (5초 ~ 60초)
- ✅ 시간 범위 선택 (30분 ~ 24시간, 30분 단위)
- ✅ 24시간 데이터 히스토리 (LocalStorage 영속성)
- ✅ Peak 시점 빨간 점 표시
- ✅ Netfilter 커널 모듈 (선택적)

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ /metrics 페이지                                   │  │
│  │ - 4개 그래프 (Recharts)                          │  │
│  │ - 폴링 간격/시간 범위 선택                        │  │
│  │ - LocalStorage 24시간 히스토리                   │  │
│  │ - Peak 시점 표시                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP 폴링 (5초~60초)
                      │ fetch('/api/metrics/*')
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ GET /api/metrics/cpu      - CPU 사용률           │  │
│  │ GET /api/metrics/memory   - 메모리 사용률        │  │
│  │ GET /api/metrics/disk     - 디스크 사용률        │  │
│  │ GET /api/metrics/network  - 네트워크 I/O         │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │ psutil                             │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  System (OS)                             │
│  - CPU, Memory, Disk, Network 정보                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Kernel Module (선택적)                      │
│  /proc/net/traffic_stats                                │
│  - Netfilter 기반 패킷 레벨 모니터링                     │
│  - 포트별 TCP/UDP 트래픽 통계                            │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ 구현된 기능

### 1. 메트릭 모니터링

#### CPU (프로세서 사용률)
- **수집 항목**: 사용률(%), 코어 수, 주파수(MHz)
- **API**: `GET /api/metrics/cpu`
- **그래프 색상**: 파란색 (#3b82f6)

#### Memory (메모리 사용률)
- **수집 항목**: 사용률(%), 사용 가능(MB), 전체(MB)
- **API**: `GET /api/metrics/memory`
- **그래프 색상**: 녹색 (#10b981)

#### Disk (디스크 사용률)
- **수집 항목**: 사용률(%), 남은 공간(GB), 전체(GB)
- **API**: `GET /api/metrics/disk`
- **그래프 색상**: 주황색 (#f59e0b)

#### Network (네트워크 I/O)
- **수집 항목**: 송신(MB), 수신(MB), 패킷 수
- **API**: `GET /api/metrics/network`
- **그래프 색상**: 빨간색 (#ef4444)

### 2. 사용자 인터페이스

#### 폴링 간격 선택
```
옵션: 5초, 10초, 30초, 60초
기본값: 5초
```

#### 시간 범위 선택 (30분 단위)
```
옵션:
  30분, 1시간, 1시간 30분, 2시간, 2시간 30분, 3시간,
  3시간 30분, 4시간, 4시간 30분, 5시간, 5시간 30분, 6시간,
  8시간, 10시간, 12시간, 18시간, 24시간
기본값: 2시간
```

#### Peak 시점 표시
- 각 그래프에서 최댓값(peak) 자동 감지
- Peak 지점에 빨간 점(🔴) 표시
- 제목에 "🔴 Peak: 값%" 표시
- 마우스 오버 시 "Peak: 시간" 라벨 표시

#### 마우스 휠 확대/축소
```
휠 위로 (↑)   → 시간 범위 30분씩 축소 (확대) → 최소 30분
휠 아래로 (↓) → 시간 범위 30분씩 확장 (축소) → 최대 24시간
```

**동작 방식:**
- 그래프 영역에서 마우스 휠 조작 가능
- 4개 차트 동시 조절 (시간 범위 동기화)
- 드롭다운과 자동 동기화
- 페이지 스크롤과 분리 (preventDefault)
- 실시간 그래프 업데이트

**예시:**
```
2시간 → 휠 ↑ → 1.5시간 → 휠 ↑ → 1시간 → 휠 ↑ → 30분 (최소)
2시간 → 휠 ↓ → 2.5시간 → 휠 ↓ → 3시간 → ... → 24시간 (최대)
```

### 3. 데이터 관리

#### 24시간 히스토리
- **최대 데이터 포인트**: 17,280개 (24시간 @ 5초 간격)
- **저장 방식**: 메모리 + LocalStorage
- **자동 정리**: 24시간 초과 데이터 삭제

#### LocalStorage 영속성
- **키**: `metrics_history_v1`
- **저장 주기**: 5개 데이터마다 배치 저장
- **복원**: 페이지 로드 시 자동 복원
- **필터링**: 24시간 이내 데이터만 유지

---

## 🔌 API 명세

### Base URL
```
http://localhost:8000
```

### 1. CPU 메트릭
```http
GET /api/metrics/cpu
```

**Response:**
```json
{
  "timestamp": "2026-02-10T12:00:00",
  "cpu_percent": 45.5,
  "cpu_count": 8,
  "cpu_freq": 2400.0
}
```

### 2. Memory 메트릭
```http
GET /api/metrics/memory
```

**Response:**
```json
{
  "timestamp": "2026-02-10T12:00:00",
  "memory_percent": 65.2,
  "memory_available_mb": 8192.5,
  "memory_total_mb": 16384.0
}
```

### 3. Disk 메트릭
```http
GET /api/metrics/disk
```

**Response:**
```json
{
  "timestamp": "2026-02-10T12:00:00",
  "disk_percent": 42.8,
  "disk_free_gb": 128.5,
  "disk_total_gb": 256.0
}
```

### 4. Network 메트릭
```http
GET /api/metrics/network
```

**Response:**
```json
{
  "timestamp": "2026-02-10T12:00:00",
  "bytes_sent_mb": 1024.5,
  "bytes_recv_mb": 2048.8,
  "packets_sent": 150000,
  "packets_recv": 250000
}
```

---

## 💻 프론트엔드 구현

### 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State**: React Hooks (useState, useEffect, useMemo)

### 주요 컴포넌트

#### 1. MetricsPage (`/app/metrics/page.tsx`)
- 메인 대시보드 페이지
- 4개 메트릭 데이터 폴링
- LocalStorage 저장/로드
- 시간 범위 필터링

**주요 기능:**
```typescript
- pollingInterval: 폴링 간격 상태 (기본 5000ms)
- viewWindowHours: 시간 범위 상태 (기본 2시간)
- cpuHistory, memoryHistory, diskHistory, networkSentHistory: 24시간 히스토리
- getFilteredData(): 시간 범위별 데이터 필터링 (useMemo)
```

#### 2. MetricsChart (`/components/MetricsChart.tsx`)
- 재사용 가능한 그래프 컴포넌트
- Recharts LineChart 사용
- Peak 시점 자동 감지 및 표시

**Props:**
```typescript
interface MetricsChartProps {
  data: MetricDataPoint[];  // 표시할 데이터
  title: string;             // 그래프 제목
  color: string;             // 선 색상
  unit: string;              // 단위 (%, MB, GB)
  yDomain?: [number, number]; // Y축 범위
}
```

**Peak 표시:**
```typescript
- findPeak(): 최댓값 찾기 (useMemo)
- ReferenceDot: 빨간 점 표시
- Tooltip: 마우스 오버 시 정보 표시
```

### 데이터 흐름

```
1. useEffect (초기 로드)
   └─> LocalStorage 복원
   └─> 초기 데이터 fetch
   └─> 폴링 시작 (setInterval)

2. 폴링 (5초마다)
   └─> fetch('/api/metrics/cpu')
   └─> fetch('/api/metrics/memory')
   └─> fetch('/api/metrics/disk')
   └─> fetch('/api/metrics/network')
   └─> 상태 업데이트 (최대 17,280개 유지)
   └─> LocalStorage 저장 (배치)

3. 시간 범위 변경
   └─> viewWindowHours 업데이트
   └─> getFilteredData() 재실행 (useMemo)
   └─> 그래프 자동 업데이트

4. Peak 계산
   └─> findPeak() 실행 (useMemo)
   └─> ReferenceDot 위치 업데이트
```

---

## 🖥️ 백엔드 구현

### 기술 스택
- **Framework**: FastAPI
- **Language**: Python 3.12
- **Library**: psutil 7.2.2
- **Validation**: Pydantic

### 디렉토리 구조
```
backend/
├── app/
│   ├── main.py              # FastAPI 앱, 라우터 등록
│   ├── routers/
│   │   └── metrics.py       # 메트릭 API 엔드포인트
│   └── schemas/
│       └── metrics.py       # Pydantic 스키마
└── requirements.txt         # psutil 포함
```

### 주요 코드

#### metrics.py (라우터)
```python
from fastapi import APIRouter
import psutil
from datetime import datetime

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/cpu")
def get_cpu_metrics():
    return {
        "timestamp": datetime.now().isoformat(),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "cpu_count": psutil.cpu_count(),
        "cpu_freq": psutil.cpu_freq().current if psutil.cpu_freq() else None
    }

# memory, disk, network 엔드포인트도 동일한 패턴
```

---

## 🐧 커널 모듈 (선택적)

### 개요
Netfilter 기반 네트워크 패킷 레벨 모니터링 모듈

### 파일 위치
```
kernel/network_monitor/
├── network_monitor.c    # Netfilter 모듈 소스 (501줄)
├── Makefile            # 빌드 설정
└── README.md           # 상세 문서
```

### 주요 기능
- **Netfilter Hooks**: PRE_ROUTING, POST_ROUTING
- **포트별 통계**: TCP/UDP 포트별 패킷/바이트 수
- **데이터 구조**: Hash table (1024 버킷, 최대 4096 포트)
- **/proc 인터페이스**: `/proc/net/traffic_stats` (JSON 출력)

### 사용 방법 (Linux 서버)
```bash
cd kernel/network_monitor

# 빌드
make

# 모듈 로드
sudo insmod network_monitor.ko

# 확인
cat /proc/net/traffic_stats

# 모듈 언로드
sudo rmmod network_monitor
```

### 백엔드 연동 (향후)
```python
@router.get("/network-packets")
def get_network_packets():
    with open("/proc/net/traffic_stats") as f:
        data = json.loads(f.read())
    return {
        "timestamp": datetime.now().isoformat(),
        "tcp_stats": data["tcp"],
        "udp_stats": data["udp"],
        "total": data["total"]
    }
```

---

## 🚀 실행 방법

### 1. 백엔드 실행
```bash
cd backend

# 가상환경 활성화 (Windows)
.venv\Scripts\activate

# 서버 시작
uvicorn app.main:app --reload

# 접속
# API: http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

### 2. 프론트엔드 실행
```bash
cd frontend

# 개발 서버 시작
npm run dev

# 접속
# 홈: http://localhost:3001
# 메트릭: http://localhost:3001/metrics
```

---

## 🧪 테스트 방법

### API 테스트 (Swagger UI)
```
1. http://localhost:8000/docs 접속
2. 각 엔드포인트 "Try it out" 클릭
3. "Execute" 클릭
4. Response 확인
```

### API 테스트 (curl)
```bash
# CPU
curl http://localhost:8000/api/metrics/cpu

# Memory
curl http://localhost:8000/api/metrics/memory

# Disk
curl http://localhost:8000/api/metrics/disk

# Network
curl http://localhost:8000/api/metrics/network
```

### UI 테스트
```
1. http://localhost:3001/metrics 접속

2. 폴링 간격 테스트
   - 드롭다운에서 "10초" 선택
   - 10초마다 그래프 업데이트 확인

3. 시간 범위 테스트
   - "30분" 선택 → 최근 30분 표시
   - "6시간" 선택 → 최근 6시간 표시
   - "24시간" 선택 → 전체 히스토리 표시

4. Peak 표시 테스트
   - 각 그래프에서 빨간 점 확인
   - 제목에 "🔴 Peak: 값%" 확인
   - 빨간 점에 마우스 오버 시 tooltip 확인

5. 영속성 테스트
   - 브라우저 새로고침 (F5)
   - "LocalStorage에서 N개 데이터 복원됨" 메시지 확인
   - 기존 데이터 유지 확인
```

---

## 📁 주요 파일 목록

### 백엔드
```
backend/
├── app/
│   ├── main.py                      # FastAPI 앱 (34줄)
│   ├── routers/
│   │   ├── metrics.py               # 메트릭 API (125줄)
│   │   └── examples.py              # 예제 라우터
│   ├── schemas/
│   │   ├── metrics.py               # 메트릭 스키마 (77줄)
│   │   └── user.py                  # 사용자 스키마
│   ├── models/                      # SQLAlchemy 모델
│   └── database.py                  # DB 설정
└── requirements.txt                 # psutil 포함
```

### 프론트엔드
```
frontend/src/
├── app/
│   ├── page.tsx                     # 홈 페이지
│   ├── metrics/
│   │   └── page.tsx                 # 메트릭 대시보드 (400줄)
│   └── login/
│       └── page.tsx                 # 로그인 페이지
├── components/
│   └── MetricsChart.tsx             # 그래프 컴포넌트 (103줄)
└── types/
    └── metrics.ts                   # TypeScript 타입 (39줄)
```

### 커널 모듈
```
kernel/network_monitor/
├── network_monitor.c                # Netfilter 모듈 (501줄)
├── Makefile                         # 빌드 설정
├── README.md                        # 상세 문서
└── .gitignore                       # 빌드 파일 제외
```

---

## 📊 데이터 구조

### MetricDataPoint (프론트엔드)
```typescript
interface MetricDataPoint {
  timestamp: number;  // Unix milliseconds
  value: number;      // 메트릭 값 (%, MB, GB)
}
```

### CPUMetrics (백엔드)
```python
class CPUMetrics(BaseModel):
    timestamp: datetime
    cpu_percent: float    # 0-100
    cpu_count: int        # 논리 CPU 코어 수
    cpu_freq: float       # MHz
```

### LocalStorage 구조
```json
{
  "cpu": [
    { "timestamp": 1707552000000, "value": 45.5 },
    { "timestamp": 1707552005000, "value": 47.2 },
    ...
  ],
  "memory": [...],
  "disk": [...],
  "networkSent": [...]
}
```

---

## 🎨 UI 레이아웃

```
┌───────────────────────────────────────────────────────────┐
│ System Metrics                                             │
│ 실시간 시스템 모니터링                         [← 홈으로] │
│                                                            │
│ [폴링: ▼ 5초] [시간 범위: ▼ 2시간]                        │
│ 💡 Tip: 시간 범위를 선택하여 그래프 기간 조정              │
│ LocalStorage에서 1234개 데이터 복원됨                      │
└───────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ CPU Usage (%)            │ Memory Usage (%)         │
│ 🔴 Peak: 85.3%           │ 🔴 Peak: 72.1%           │
├──────────────────────────┼──────────────────────────┤
│        Peak: 10:35       │        Peak: 11:20       │
│  100%│       🔴          │  100%│                   │
│   80%│   ╱───╲          │   80%│         ╱─🔴─╲    │
│   60%│ ╱─     ─╲        │   60%│     ╱───     ───╲ │
│   40%│          ───╲    │   40%│ ╱───             │
│   20%│              ───╲│   20%│                   │
│    0%└──────────────────│    0%└───────────────────│
│      10:00   10:30  11:00│     10:00   10:30  11:00│
└──────────────────────────┴──────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ Disk Usage (%)           │ Network Sent (MB)        │
│ 🔴 Peak: 68.5%           │ 🔴 Peak: 156.8MB         │
├──────────────────────────┼──────────────────────────┤
│        Peak: 10:45       │        Peak: 10:50       │
│  100%│                   │  200MB│                   │
│   80%│             🔴    │  160MB│           🔴      │
│   60%│         ╱───╲    │  120MB│       ╱───╲      │
│   40%│     ╱───     ───╲│   80MB│   ╱───     ───╲  │
│   20%│ ╱───             │   40MB│ ╱─               │
│    0%└──────────────────│    0MB└───────────────────│
│      10:00   10:30  11:00│     10:00   10:30  11:00│
└──────────────────────────┴──────────────────────────┘
```

---

## 🔧 성능 최적화

### 프론트엔드
1. **useMemo**: 데이터 필터링 및 peak 계산 메모이제이션
2. **배치 저장**: LocalStorage 5개 데이터마다 저장
3. **데이터 제한**: 최대 17,280개 포인트로 메모리 관리
4. **Recharts**: Canvas 기반 렌더링으로 높은 성능

### 백엔드
1. **psutil**: 최적화된 시스템 정보 수집
2. **Pydantic**: 빠른 JSON 직렬화
3. **비동기 가능**: FastAPI의 async/await 지원 (향후 확장)

---

## 🚧 향후 개선 사항

### 1. 실시간성 강화
- [ ] WebSocket으로 전환 (HTTP 폴링 → 실시간 푸시)
- [ ] Server-Sent Events (SSE) 고려

### 2. 데이터 영속성
- [ ] 백엔드 DB 저장 (SQLite → PostgreSQL)
- [ ] 시계열 데이터베이스 (TimescaleDB, InfluxDB)
- [ ] 주간/월간 리포트 생성

### 3. 알림 기능
- [ ] 임계값 설정 (CPU > 80%, Memory > 90%)
- [ ] 이메일/슬랙 알림
- [ ] 알림 히스토리

### 4. 고급 분석
- [ ] 프로세스별 CPU/Memory 추적
- [ ] GPU 사용률 모니터링
- [ ] 디스크 I/O 레이트 (읽기/쓰기 속도)
- [ ] 네트워크 패킷 분석 (커널 모듈 활용)

### 5. 사용자 경험
- [ ] 다크 모드
- [ ] 대시보드 커스터마이징 (드래그 앤 드롭)
- [ ] 여러 서버 동시 모니터링
- [ ] 비교 모드 (어제 vs 오늘)

### 6. 데이터 내보내기
- [ ] CSV 다운로드
- [ ] JSON 내보내기
- [ ] PDF 리포트 생성

---

## 📝 참고 자료

### 외부 라이브러리
- [psutil](https://psutil.readthedocs.io/) - 시스템 정보 수집
- [Recharts](https://recharts.org/) - React 차트 라이브러리
- [Next.js](https://nextjs.org/) - React 프레임워크
- [FastAPI](https://fastapi.tiangolo.com/) - Python 웹 프레임워크

### 커널 모듈 참고
- [Linux Kernel Module Programming Guide](https://sysprog21.github.io/lkmpg/)
- [Netfilter Hacking HOWTO](https://www.netfilter.org/documentation/HOWTO/netfilter-hacking-HOWTO.html)

---

## 📅 개발 히스토리

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2026-02-10 | 백엔드 API 구현 (CPU, Memory, Disk, Network) | be-agent |
| 2026-02-10 | 프론트엔드 UI 구현 (4등분 그래프) | fe-agent |
| 2026-02-10 | 폴링 간격 선택 기능 추가 | fe-agent |
| 2026-02-10 | 24시간 히스토리 + LocalStorage 구현 | fe-agent |
| 2026-02-10 | 시간 범위 30분 단위 세분화 | fe-agent |
| 2026-02-10 | Peak 시점 빨간 점 표시 기능 추가 | fe-agent |
| 2026-02-10 | Network Delta 계산 (누적→증가량) | fe-agent |
| 2026-02-10 | Network Sent/Recv 한 그래프에 표시 | fe-agent |
| 2026-02-10 | 마우스 휠 확대/축소 기능 추가 | fe-agent |
| 2026-02-10 | Netfilter 커널 모듈 구현 | kernel-agent |
| 2026-02-10 | 문서화 완료 및 업데이트 | main-agent |

---

## ✅ 완료 조건 체크리스트

### API 테스트
- [x] GET /api/metrics/cpu 정상 동작
- [x] GET /api/metrics/memory 정상 동작
- [x] GET /api/metrics/disk 정상 동작
- [x] GET /api/metrics/network 정상 동작
- [x] Swagger UI 접근 가능

### UI 연동
- [x] 4등분 그래프 표시 (2x2)
- [x] 폴링 간격 선택 동작 (5초~60초)
- [x] 시간 범위 선택 동작 (30분 단위, 30분~24시간)
- [x] 시간 범위 변경 시 그래프 reload
- [x] 마우스 휠 확대/축소 (30분 단위)
- [x] Peak 시점 빨간 점 표시
- [x] Network Delta 계산 (누적→증가량)
- [x] Network Sent/Recv 한 그래프에 표시
- [x] LocalStorage 데이터 복원
- [x] 에러 처리 및 로딩 상태

### 추가 기능
- [x] 24시간 데이터 히스토리 (최대 17,280 포인트)
- [x] LocalStorage 영속성
- [x] Peak 자동 감지 및 표시 (각 라인별)
- [x] 실시간 그래프 업데이트
- [x] Netfilter 커널 모듈 (코드 완성)

---

## 🎯 결론

시스템 메트릭 모니터링 웹 애플리케이션이 성공적으로 구현되었습니다. 4개 메트릭을 실시간으로 모니터링하며, 사용자가 폴링 간격과 시간 범위를 자유롭게 조정할 수 있습니다. 24시간 데이터 히스토리와 LocalStorage 영속성을 통해 장기적인 추세 분석이 가능하며, Peak 시점 표시 기능으로 이상 징후를 빠르게 파악할 수 있습니다.

향후 WebSocket, 알림 기능, 프로세스별 모니터링 등의 고급 기능을 추가하여 프로덕션 레벨의 모니터링 시스템으로 발전시킬 수 있습니다.

**문서 작성일**: 2026-02-10
**작성자**: Claude Code (Sonnet 4.5)
**버전**: 1.0
