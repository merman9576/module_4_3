# Kernel Modules

이 디렉토리는 시스템 메트릭 모니터링을 위한 Linux 커널 모듈을 포함합니다.

## 개요

현재 시스템은 psutil을 사용하여 백엔드에서 메트릭을 수집하지만, 더 심층적인 분석이 필요한 경우 커널 모듈을 활용할 수 있습니다.

## 디렉토리 구조

```
kernel/
├── README.md                  # 이 파일
└── network_monitor/           # 네트워크 패킷 모니터링 모듈
    ├── Makefile               # 커널 모듈 빌드 설정
    ├── network_monitor.c      # Netfilter 기반 모듈 소스
    └── README.md              # 모듈별 상세 문서
```

## 사용 시나리오

### 1. Network Monitor Module
- **목적**: 포트별, 프로토콜별 네트워크 트래픽 상세 분석
- **기술**: Netfilter hooks (NF_INET_PRE_ROUTING, NF_INET_POST_ROUTING)
- **인터페이스**: /proc/net/traffic_stats

### 향후 확장 가능한 모듈

- `cpu_monitor/`: 프로세스별 CPU 스케줄링 분석
- `memory_monitor/`: 페이지 폴트, 메모리 할당 추적
- `disk_monitor/`: 블록 I/O 레이어 모니터링

## 개발 워크플로우

### 1. 모듈 개발 (kernel-agent)
```bash
# kernel-agent에게 작업 요청
"네트워크 트래픽을 포트별로 모니터링하는 Netfilter 모듈 만들어줘"
```

### 2. 빌드 및 검증 (kernel-agent)
```bash
cd kernel/network_monitor
make
sudo insmod network_monitor.ko
cat /proc/net/traffic_stats
```

### 3. 백엔드 연동 (be-agent)
```python
# backend/app/routers/metrics.py
@router.get("/network-packets")
def get_network_packets():
    with open("/proc/net/traffic_stats") as f:
        data = f.read()
    # 파싱 후 반환
```

### 4. 프론트엔드 시각화 (fe-agent)
```typescript
// 새로운 차트로 포트별 트래픽 표시
```

## 요구사항

- **OS**: Linux (Ubuntu 20.04+ 권장)
- **커널 헤더**: `sudo apt install linux-headers-$(uname -r)`
- **빌드 도구**: gcc, make

## 주의사항

- 커널 모듈은 시스템 안정성에 영향을 줄 수 있으므로 테스트 환경에서 먼저 검증하세요
- 프로덕션 환경에서는 충분한 테스트 후 배포하세요
- 커널 패닉 발생 시 안전 모드로 부팅하여 모듈을 제거하세요

## 참고 자료

- [Linux Kernel Module Programming Guide](https://sysprog21.github.io/lkmpg/)
- [Netfilter Hacking HOWTO](https://www.netfilter.org/documentation/HOWTO/netfilter-hacking-HOWTO.html)
- [The Linux Kernel documentation](https://www.kernel.org/doc/html/latest/)
