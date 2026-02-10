# report_format — 검증 결과 리포트 출력 포맷

## 출력 형식

각 Stage 결과를 아이콘 + 한 줄 요약으로 출력한다.

```
========================================
  kernel-build-verify 결과 리포트
  모듈: netfilter_log.ko
  시간: 2025-01-15 14:30:22
========================================

[Stage 1: 빌드]
  ✅ 빌드 성공 — netfilter_log.ko (12.4KB)

[Stage 2: 정적 분석]
  ✅ hook 해제: nf_unregister_net_hook 확인
  ✅ 메모리: kmalloc/kfree 짝 일치
  ✅ proc 정리: remove_proc_entry 확인
  ⚠️ 경고: 훅 콜백 내 printk 사용 — 고트래픽 시 성능 저하 가능
  📊 결과: 0 ERROR / 1 WARNING

[Stage 3: 로드/언로드]
  ✅ insmod 성공
  ✅ dmesg 에러 없음
  ✅ /proc/pkt_log 생성 확인
  ✅ rmmod 정상 완료
  ✅ dmesg 언로드 로그 정상

[최종 판정]
  ✅ PASS — 모듈 사용 가능
  💡 권장: printk를 rate-limit하거나 debugfs 카운터로 대체 권장
========================================
```

## 판정 기준

| 조건 | 판정 |
|------|------|
| 모든 Stage 통과, ERROR 0건 | ✅ PASS |
| WARNING만 있음 | ✅ PASS (권장사항 포함) |
| ERROR 1건 이상 but 빌드 성공 | ⚠️ CONDITIONAL — Stage 3 스킵, 수정 필요 |
| 빌드 실패 | ❌ FAIL |

## 실패 시 후속 조치

- 빌드 실패 → `auto_fix`로 재시도 또는 에러 내용을 사용자에게 안내
- 정적 분석 ERROR → 해당 라인과 수정 가이드를 함께 출력
- 로드 실패 → `dmesg` 전체 출력 + 원인 분석