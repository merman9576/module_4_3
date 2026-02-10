# review_template — 코드 분석 리포트 출력 템플릿

## 출력 형식

```
========================================
  kernel-analyze review 리포트
  대상: {source_path}
========================================

## 1. 모듈 개요

- 훅 포인트: NF_INET_PRE_ROUTING
- 수집 데이터: src_ip, dst_port, pkt_size
- 노출 방식: /proc/pkt_log (seq_file)
- 필터: TCP only

## 2. 구조 평가

| 항목 | 상태 | 비고 |
|------|------|------|
| module_init/exit 쌍 | ✅ | 정상 |
| hook 등록/해제 | ✅ | nf_unregister_net_hook 확인 |
| proc 생성/제거 | ✅ | remove_proc_entry 확인 |
| 에러 핸들링 | ⚠️ | proc_create 실패 시 hook 미해제 |

## 3. 성능 이슈

- ⚠️ 훅 콜백 내 spin_lock 범위가 넓음 → 최소화 권장
- ⚠️ 매 패킷 printk → rate_limit 또는 제거 권장
- ✅ 고정 크기 ring buffer 사용 — 메모리 안정적

## 4. 보안 검토

- ✅ /proc 파일 권한 0444 (읽기 전용)
- ✅ copy_to_user 미사용 (seq_file이 대신 처리)
- ⚠️ ring buffer 인덱스 overflow 시 모듈 동작 체크 필요

## 5. 개선 제안

1. init 에러 경로에서 hook 해제 추가:
   → proc_create 실패 시 goto err_unreg_hook 패턴 적용

2. printk 제거 또는 net_ratelimit() 적용:
   → 고트래픽 환경에서 dmesg 버퍼 넘침 방지

3. ring buffer를 커널 파라미터로 크기 조절 가능하게:
   → module_param(log_size, int, 0444)
========================================
```

## 작성 원칙

- 각 항목은 **현재 상태 + 구체적 개선 방법**을 함께 제시
- 에러/경고 아이콘으로 한눈에 심각도 파악 가능하게
- 개선 제안은 실제 적용 가능한 코드 수준으로 구체적으로 작성
- 시큐아이 교육생은 커널에 숙련되어 있으므로, 기초 설명은 생략하고 핵심만 전달