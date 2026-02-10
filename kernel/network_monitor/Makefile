# Makefile for Network Monitor Kernel Module

# 모듈 이름
obj-m += network_monitor.o

# 커널 소스 디렉토리
KERNEL_DIR ?= /lib/modules/$(shell uname -r)/build

# 현재 디렉토리
PWD := $(shell pwd)

# 기본 타겟: 모듈 빌드
all:
	$(MAKE) -C $(KERNEL_DIR) M=$(PWD) modules

# 모듈 설치 (선택사항)
install:
	$(MAKE) -C $(KERNEL_DIR) M=$(PWD) modules_install
	depmod -a

# 청소
clean:
	$(MAKE) -C $(KERNEL_DIR) M=$(PWD) clean

# 모듈 로드 (root 권한 필요)
load:
	sudo insmod network_monitor.ko
	@echo "Module loaded. Check with: lsmod | grep network_monitor"

# 모듈 언로드 (root 권한 필요)
unload:
	sudo rmmod network_monitor
	@echo "Module unloaded."

# 모듈 상태 확인
status:
	@lsmod | grep network_monitor || echo "Module not loaded"
	@echo ""
	@echo "Proc interface:"
	@cat /proc/net/traffic_stats 2>/dev/null || echo "/proc/net/traffic_stats not found"

# 커널 로그 확인
log:
	dmesg | tail -20

# 테스트: 로드 -> 상태 확인 -> 언로드
test: all load
	@sleep 2
	@$(MAKE) status
	@sleep 3
	@$(MAKE) unload

# 도움말
help:
	@echo "사용 가능한 타겟:"
	@echo "  make          - 모듈 빌드"
	@echo "  make clean    - 빌드 파일 제거"
	@echo "  make load     - 모듈 로드 (sudo 필요)"
	@echo "  make unload   - 모듈 언로드 (sudo 필요)"
	@echo "  make status   - 모듈 상태 확인"
	@echo "  make log      - 커널 로그 확인"
	@echo "  make test     - 빌드 + 로드 + 테스트 + 언로드"
	@echo "  make install  - 모듈 설치"

.PHONY: all clean load unload status log test help install
