---
name: function-system-metric-monitor
description: 시스템 매트릭 (CPU, MEM, DISK, Traffic) 모니터링 화면 구현
disable-model-invocation: true
---
## 기능 동작
시스템 매트릭 (CPU, MEM, DISK, Traffic) 모니터링 화면(추이 그래프) 출력
  - 4등분하여 결과 출력 (2x2 그리드)
  - 상단에 매트릭 정보를 가져올 주기와 추이그래프의 x축에 표시할 시간 범위를 30분단위로(30분, 1시간, 1시간 30분, ...) 선택
    . 폴링 간격: 5초, 10초, 30초, 60초 중 선택 (기본: 5초)
    . 시간 범위: 30분 ~ 24시간 (30분 단위, 17개 옵션, 기본: 2시간)
    . 시간 범위 변경시 4개의 추이 그래프의  x축을 시간 범위로 재설정하여 reload
    . 마우스 휠 움직임에 따라 그래프 확대(시간축 축소), 축소(시간축 확장) 동작
      - 휠 위로: 시간 범위 30분씩 축소 (확대, 최소 30분)
      - 휠 아래로: 시간 범위 30분씩 확장 (축소, 최대 24시간)
      - 그래프 영역 전체에서 동작 (4개 차트 동시 조절)
  - 4개 매트릭 정보에서 시간 범위 중 peak 시점에 해당하는 시간/% 위치에 빨간 점을 표시
    . Peak 지점에 빨간 점(🔴) + 시간 라벨
    . 제목에 "🔴 Peak: 값%" 표시
    . 마우스 오버 시 Tooltip에서 peak 정보 표시
  - Traffic은 누적 값이 아닌, 이전 확인 시점부터 증가한 delta 값만 표기
    . Traffic은 Sent/Recv 두 값을 한 그래프에 두 개의 색이 다른 선으로 표시
    . Sent: 빨간색, Recv: 파란색
    . 각 라인별 Peak 표시 (색상 구분)
  - 24시간 데이터 히스토리 + LocalStorage 영속성
    . 최대 17,280개 포인트 (24시간 @ 5초 간격)
    . 페이지 새로고침 시 자동 복원

## 개발 단계
1. 커널 모듈은 kernel-agent로 구현
2. BE는 be-agent로 API 구현
3. FE는 fe-agent로 UI 구현

## 산출물
  - 산출물은 `.claude/docs/function-system-metric-monitor.md` 파일에 기록

## 완료 조건
- [x] API 테스트 통과
  - [x] GET /api/metrics/cpu
  - [x] GET /api/metrics/memory
  - [x] GET /api/metrics/disk
  - [x] GET /api/metrics/network
- [x] UI 연동 확인
  - [x] 4등분 그래프 (2x2)
  - [x] 폴링 간격 선택
  - [x] 시간 범위 선택 (30분 단위)
  - [x] 마우스 휠 확대/축소
  - [x] Peak 시점 표시
  - [x] Network Delta + Sent/Recv
  - [x] 24시간 히스토리
  - [x] LocalStorage 영속성