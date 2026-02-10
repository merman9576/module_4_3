# Task Management

## 현재 작업 상태

### Feature 1: 사용자 데이터 모델 및 인증 스키마 설계
- [x] 패키지 설치 (passlib[bcrypt], pydantic[email])
- [x] 보안 유틸리티 (backend/app/utils/security.py)
- [x] User 모델 (backend/app/models/user.py)
- [x] User 스키마 (backend/app/schemas/user.py)
- [x] TypeScript 타입 정의 (frontend/src/types/user.ts)
- [x] 회원가입 페이지 (frontend/src/app/register/page.tsx)
- [x] 로그인 페이지 (frontend/src/app/login/page.tsx)
- [x] 테스트 문서 작성 (.claude/docs/test.md)
- [x] GitHub repository 생성 (module_4_3)

**상태:** ✅ 완료 (2026-02-10)

---

## 다음 작업 (우선순위 순)

### Feature 2: 회원가입 API 엔드포인트
- [ ] 회원가입 라우터 생성 (backend/app/routers/auth.py)
- [ ] POST /api/auth/register 엔드포인트 구현
- [ ] 이메일 중복 검사 로직
- [ ] 비밀번호 해싱 후 DB 저장
- [ ] 회원가입 비즈니스 로직 (backend/app/services/auth.py)
- [ ] main.py에 라우터 등록
- [ ] Swagger UI 테스트

**예상 소요:** 1-1.5시간

---

### Feature 3: 로그인 및 JWT 토큰 인증
- [ ] JWT 토큰 생성/검증 함수 (backend/app/utils/security.py)
- [ ] 로그인 엔드포인트 (POST /api/auth/login)
- [ ] 이메일/비밀번호 검증 로직
- [ ] JWT 토큰 발급 및 반환
- [ ] Token 스키마 (backend/app/schemas/auth.py)
- [ ] 프론트엔드 토큰 저장 로직 (localStorage)
- [ ] 환경변수 설정 (JWT SECRET_KEY)

**예상 소요:** 2-3시간

---

### Feature 4: 인증 미들웨어 및 보호된 엔드포인트
- [ ] 현재 사용자 인증 의존성 (backend/app/dependencies/auth.py)
- [ ] get_current_user 함수 (JWT 검증)
- [ ] Authorization 헤더 추출 로직
- [ ] API 인터셉터 (frontend/src/lib/api/client.ts)
- [ ] 자동 토큰 추가 로직
- [ ] 보호된 엔드포인트 예시

**예상 소요:** 1.5-2시간

---

### Feature 5: 사용자 정보 조회 API
- [ ] GET /api/users/me 엔드포인트
- [ ] 현재 로그인된 사용자 정보 반환
- [ ] 프론트엔드 API 호출 함수

**예상 소요:** 30분-1시간

---

### Feature 6: 프론트엔드 인증 상태 관리
- [ ] AuthContext 생성 (frontend/src/contexts/AuthContext.tsx)
- [ ] useAuth 커스텀 훅
- [ ] AuthProvider 앱 루트 적용
- [ ] login, logout, register 함수 통합

**예상 소요:** 1-1.5시간

---

### Feature 7: 로그아웃 기능
- [ ] 로그아웃 함수 (토큰 제거)
- [ ] 사용자 상태 초기화
- [ ] 로그인 페이지 리다이렉트
- [ ] 로그아웃 버튼 UI

**예상 소요:** 30분

---

### Feature 8: 보호된 페이지 라우팅
- [ ] ProtectedRoute 컴포넌트
- [ ] 미들웨어 설정 (선택)
- [ ] 보호된 페이지 예시 (대시보드)

**예상 소요:** 1시간

---

## 보안 및 추가 고려사항

### 보안
- [ ] CORS 설정 확인
- [ ] 환경변수로 JWT SECRET_KEY 관리
- [ ] Rate limiting 검토

### 테스팅
- [ ] BE: 인증 API 테스트 작성
- [ ] FE: 로그인/회원가입 폼 테스트

### 문서화
- [ ] API 문서 업데이트
- [ ] README 업데이트

---

## 완료된 작업

### 2026-02-10
- ✅ Feature 1: 사용자 데이터 모델 및 인증 스키마 설계
- ✅ 로그인 기능 TODO 문서 작성 (login_todo.md)
- ✅ 개발 가이드 작성 (dev.md)
- ✅ 테스트 결과 문서 작성 (test.md)
- ✅ GitHub repository 생성
