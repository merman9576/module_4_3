---
name: KN-build-verify
description: 커널 모듈을 빌드하고 정적 분석 및 로드/언로드 검증을 수행한다. 빌드 실패 시 에러를 분석하여 자동 수정을 시도한다.
disable-model-invocation: true
user-invocable: false
---

# kernel-build-verify

커널 모듈의 빌드, 정적 분석, 로드/언로드 검증을 순차 수행한다.
이 스킬은 `kernel-agent`를 통해서만 호출된다.

## 파라미터

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| source_dir | ✅ | `.c`와 `Makefile`이 있는 디렉토리 |
| module_name | ✅ | 모듈 이름 (`.ko` 기준) |
| auto_fix | 선택 | 빌드 실패 시 자동 수정 (기본: true, 최대 3회) |

## 검증 파이프라인

### Stage 1: 빌드

`cd {source_dir} && make clean && make` → `.ko` 파일 생성 확인.
실패 시 `auto_fix=true`이면 에러 분석 → 수정 → 재빌드.
흔한 에러는 `references/common_build_errors.md` 참조.

### Stage 2: 정적 분석

| 체크 항목 | 심각도 | 설명 |
|-----------|--------|------|
| hook 해제 누락 | 🔴 ERROR | `nf_unregister_net_hook` 없음 |
| kmalloc/kfree 불일치 | 🔴 ERROR | 해제 경로 없음 |
| proc 엔트리 미제거 | 🔴 ERROR | `remove_proc_entry` 누락 |
| copy_to_user 미사용 | 🟡 WARN | 유저 버퍼 직접 쓰기 |
| spinlock 범위 과다 | 🟡 WARN | 긴 critical section |
| printk 과다 | 🟡 WARN | 매 패킷 printk (성능 저하) |
| MODULE_LICENSE 누락 | 🔴 ERROR | GPL 선언 없음 |

🔴 ERROR가 1건 이상이면 Stage 3 스킵.

### Stage 3: 로드/언로드

`insmod` → `lsmod` 확인 → `dmesg` 에러 체크 → 인터페이스 생성 확인 → `rmmod` → `dmesg` 재확인.
root 권한(`sudo`) 필요.

### Stage 4: 리포트

모든 단계 결과를 종합. 포맷은 `references/report_format.md` 참조.

## 후속

- 분석/리팩토링이 필요하면 `KN-analyze` 스킬에 위임
- 빌드 환경에 `linux-headers-$(uname -r)` 필요