---
name: KN-generate
description: Netfilter 기반 Linux 커널 모듈 코드(.c)와 Makefile을 자동 생성한다. 훅 포인트, 수집 데이터, 유저스페이스 노출 방식을 지정하면 빌드 가능한 모듈을 생성한다.
disable-model-invocation: true
user-invocable: false
---

# kernel-generate

Netfilter 훅 기반 커널 모듈 소스코드와 Makefile을 생성한다.
이 스킬은 `kernel-agent`를 통해서만 호출된다.

## 파라미터

| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| hook_point | `NF_INET_PRE_ROUTING` | PRE_ROUTING, LOCAL_IN, FORWARD, LOCAL_OUT, POST_ROUTING |
| collect | `src_ip, dst_ip, dst_port` | 수집할 패킷 메타데이터 |
| expose_via | `proc` | 유저스페이스 노출 방식: `proc`, `debugfs`, `netlink` |
| filter | 없음 | 필터 조건 (예: TCP only, port 443) |
| module_name | `netfilter_mod` | 모듈 이름 |

## 출력

- `{module_name}.c` — 커널 모듈 소스
- `Makefile` — 빌드용

## 코드 생성 규칙

1. Linux kernel coding style 준수 (탭 들여쓰기, 80컬럼)
2. `module_init` / `module_exit` 반드시 쌍으로 정의
3. `module_exit`에서 반드시 `nf_unregister_net_hook` 호출
4. `kmalloc` 사용 시 `module_exit`에서 `kfree` 보장
5. `printk` 레벨은 `KERN_INFO` 사용
6. `MODULE_LICENSE("GPL")` 필수
7. `/proc` 노출 시 `proc_create` + `seq_file` 패턴 사용
8. 패킷 헤더 접근 시 `skb_network_header` 유효성 체크

## 노출 방식별 참조

- **proc**: `references/proc_example.md` — seq_file 기반, 읽기 전용에 적합
- **debugfs**: `references/debugfs_example.md` — 디버깅용, 프로덕션 비권장
- **netlink**: `references/netlink_example.md` — 고속 스트리밍, BE 연동에 최적

## Makefile

`obj-m += {module_name}.o`, `KDIR := /lib/modules/$(shell uname -r)/build` 기반.
`all`/`clean` 타겟 포함.

## 예시

> "PRE_ROUTING에서 TCP의 src_ip, dst_port, 크기를 /proc/pkt_log로 노출해줘"

→ 파라미터 파싱 → `references/proc_example.md` 참조 → `pkt_log.c` + `Makefile` 생성

## 후속

- 빌드/검증은 `KN-build-verify` 스킬에 위임