---
name: KN-analyze
description: 커널 모듈 소스를 분석하여 구조, 문제점, 개선안을 제시하거나 BE/FE 연동을 위한 데이터 포맷 명세를 생성한다.
disable-model-invocation: true
user-invocable: false
---

# kernel-analyze

커널 모듈 코드 분석과 BE/FE 연동 데이터 명세 생성을 수행한다.
이 스킬은 `kernel-agent`를 통해서만 호출된다.

## 모드

| 모드 | 트리거 | 설명 |
|------|--------|------|
| `review` | "분석해줘", "리뷰해줘", "개선점" | 코드 구조 분석 + 문제점 + 개선안 |
| `spec` | "BE 연동", "API 명세", "포맷 정리" | 출력 데이터 포맷 명세 JSON 생성 |

## 파라미터

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| source_path | ✅ | 분석 대상 `.c` 파일 경로 |
| mode | ✅ | `review` 또는 `spec` |

## Mode: review

소스를 읽고 아래 항목을 추출하여 리포트 생성. 템플릿은 `references/review_template.md` 참조.

1. **모듈 개요**: 훅 포인트, 수집 데이터, 노출 인터페이스
2. **구조 평가**: init/exit 흐름, 리소스 정리, 에러 핸들링
3. **성능 이슈**: lock 범위, 메모리 할당, printk 빈도
4. **보안 검토**: 유저/커널 경계 처리, 버퍼 오버플로, 권한 체크
5. **개선 제안**: 구체적 코드 수정 방향

## Mode: spec

커널 모듈의 유저스페이스 출력 포맷을 분석하여 BE에서 바로 사용 가능한 JSON 명세를 생성.
노출 방식별 예시는 `references/spec_examples.md` 참조.

### 분석 대상

- `/proc` → `seq_printf` 포맷 문자열 추출
- `debugfs` → `debugfs_create_*` 변수 타입/이름 추출
- `netlink` → 전송 구조체 레이아웃 분석

### 출력 JSON 구조

```json
{
  "module_name": "...",
  "interface": { "type": "proc|debugfs|netlink", "path": "..." },
  "fields": [
    { "name": "...", "type": "...", "example": "..." }
  ],
  "delimiter": "...",
  "recommended_polling": "1s",
  "be_integration": { "parser_hint": "...", "websocket_compatible": true }
}
```

### BE 연동

이 명세를 BE 에이전트에 전달하면 자동 생성 가능:
- `/proc` polling 데몬 또는 netlink 수신기
- REST API 엔드포인트
- WebSocket 실시간 스트리밍 서버

## 후속

- 코드 수정 필요 시 `KN-generate`로 재생성 후 `KN-build-verify`로 검증
- 보안 검토는 기본 패턴 매칭 수준이며 정식 감사를 대체하지 않음