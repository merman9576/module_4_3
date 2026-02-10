# Network Monitor Kernel Module

Netfilter 기반 네트워크 트래픽 모니터링 커널 모듈입니다.

## 기능

이 모듈은 다음 정보를 수집합니다:

- 포트별 송수신 패킷 수
- 프로토콜별 트래픽 통계 (TCP, UDP, ICMP)
- IP 주소별 트래픽 집계
- 실시간 패킷 레이트

## 아키텍처

```
┌─────────────────────────────────────────┐
│         User Space (Backend)            │
│  /proc/net/traffic_stats 읽기           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Kernel Space                     │
│  ┌────────────────────────────────────┐ │
│  │   Netfilter Hooks                  │ │
│  │  - NF_INET_PRE_ROUTING             │ │
│  │  - NF_INET_POST_ROUTING            │ │
│  └────────────┬───────────────────────┘ │
│               │                          │
│  ┌────────────▼───────────────────────┐ │
│  │   Traffic Statistics               │ │
│  │  - Hash table (port → stats)       │ │
│  │  - Spinlock for sync               │ │
│  └────────────┬───────────────────────┘ │
│               │                          │
│  ┌────────────▼───────────────────────┐ │
│  │   /proc Interface                  │ │
│  │  - seq_file operations             │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 빌드 방법

### 1. 커널 헤더 설치
```bash
sudo apt update
sudo apt install linux-headers-$(uname -r)
```

### 2. 모듈 빌드
```bash
cd kernel/network_monitor
make
```

### 3. 모듈 로드
```bash
sudo insmod network_monitor.ko
```

### 4. 확인
```bash
lsmod | grep network_monitor
cat /proc/net/traffic_stats
```

### 5. 모듈 언로드
```bash
sudo rmmod network_monitor
```

## 인터페이스

### /proc/net/traffic_stats

출력 형식 (JSON):
```json
{
  "tcp": {
    "80": {"packets": 15234, "bytes": 8234567},
    "443": {"packets": 23456, "bytes": 12345678}
  },
  "udp": {
    "53": {"packets": 5678, "bytes": 234567}
  },
  "total": {
    "packets": 44368,
    "bytes": 20814812
  }
}
```

## 백엔드 연동 예시

```python
# backend/app/routers/metrics.py

@router.get("/network-packets")
def get_network_packets():
    """커널 모듈에서 포트별 트래픽 통계 가져오기"""
    try:
        with open("/proc/net/traffic_stats") as f:
            data = json.loads(f.read())

        return {
            "timestamp": datetime.now().isoformat(),
            "tcp_stats": data["tcp"],
            "udp_stats": data["udp"],
            "total": data["total"]
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Kernel module not loaded. Run: sudo insmod network_monitor.ko"
        )
```

## 개발 가이드

이 모듈을 실제로 구현하려면 `kernel-agent`를 사용하세요:

```
"포트별 트래픽 모니터링 Netfilter 모듈 만들어줘"
```

kernel-agent가 다음을 생성합니다:
1. `network_monitor.c` - 완전한 소스 코드
2. `Makefile` - 빌드 설정
3. 테스트 및 검증
4. 백엔드 연동 명세

## 보안 고려사항

- 모듈은 root 권한으로만 로드 가능
- 패킷 내용을 로깅하지 않음 (헤더 정보만 수집)
- DoS 방지를 위한 레이트 리미팅 필요
- Hash table 크기 제한으로 메모리 보호

## 성능 최적화

- Netfilter hook은 모든 패킷을 검사하므로 최소한의 연산만 수행
- Spinlock 대신 RCU (Read-Copy-Update) 고려
- Per-CPU 변수로 락 경합 최소화
- /proc 읽기 시에만 집계하여 핫패스 최적화

## 문제 해결

### 모듈이 로드되지 않는 경우
```bash
# 커널 로그 확인
dmesg | tail -20

# 커널 버전 확인
uname -r
ls /lib/modules/$(uname -r)/
```

### 커널 패닉 발생 시
1. 안전 모드로 부팅
2. `/etc/modules`에서 자동 로드 제거
3. `sudo rmmod network_monitor`로 수동 제거

## 향후 확장

- [ ] IPv6 지원
- [ ] 연결 추적 (conntrack) 통합
- [ ] eBPF 마이그레이션 (더 안전하고 성능 좋음)
- [ ] 실시간 알림 (netlink 소켓)
