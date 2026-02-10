---
name: function-system-metric-monitor
description: 시스템 매트릭 (CPU, MEM, DISK, Traffic) 모니터링 화면 구현
disable-model-invocation: true
---
## 기능 동작
시스템 매트릭 (CPU, MEM, DISK, Traffic) 모니터링 화면(추이 그래프) 출력
  - 4등분하여 결과 출력
  - 상단에 매트릭 정보를 가져올 주기와 추이그래프의 x축에 표시할 시간 범위를 30분단위로(30분, 1시간, 1시간 30분, ...) 선택
    . 시간 범위 변경시 4개의 추이 그래프 reload
  - 4개 매트릭 정보에서 시간 범위 중 peak 시점에 해당하는 시간/% 위치에 빨간 점을 표시해줘
  - Traffic은 누적 값이 아닌, 이전 확인 시점부터 증가한 delta 값만 표기해줘

## 개발 단계
1. 커널 모듈은 kernel-agent로 구현
2. BE는 be-agent로 API 구현
3. FE는 fe-agent로 UI 구현

## 완료 조건
- [ ] API 테스트 통과
- [ ] UI 연동 확인