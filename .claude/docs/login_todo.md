# Login 기능 개발 계획

## Feature 1: 사용자 데이터 모델 및 인증 스키마 설계

### BE
- [ ] User 모델 생성 (`backend/app/models/user.py`)
  - id, email, username, hashed_password, created_at, updated_at 필드
  - email unique constraint
- [ ] User 관련 Pydantic 스키마 생성 (`backend/app/schemas/user.py`)
  - UserCreate (회원가입 요청)
  - UserResponse (사용자 정보 응답)
  - UserLogin (로그인 요청)
- [ ] 비밀번호 해싱 유틸리티 함수 (`backend/app/utils/security.py`)
  - bcrypt 또는 passlib 사용

### FE
- [ ] TypeScript 타입 정의 (`frontend/src/types/user.ts`)
  - User, LoginRequest, RegisterRequest 인터페이스

### Kernel
- N/A

---

## Feature 2: 회원가입 기능

### BE
- [ ] 회원가입 API 엔드포인트 (`backend/app/routers/auth.py`)
  - POST `/api/auth/register`
  - 이메일 중복 검사
  - 비밀번호 해싱 후 저장
- [ ] 회원가입 비즈니스 로직 (`backend/app/services/auth.py`)
  - 사용자 생성 및 검증 로직

### FE
- [ ] 회원가입 폼 컴포넌트 (`frontend/src/components/auth/RegisterForm.tsx`)
  - email, username, password, password confirmation 입력 필드
  - 클라이언트 측 유효성 검사
- [ ] 회원가입 API 호출 함수 (`frontend/src/lib/api/auth.ts`)

### Kernel
- N/A

---

## Feature 3: 로그인 및 JWT 토큰 인증

### BE
- [ ] JWT 토큰 생성/검증 함수 (`backend/app/utils/security.py`)
  - python-jose 라이브러리 사용
  - access_token 생성 (만료 시간 설정)
- [ ] 로그인 API 엔드포인트 (`backend/app/routers/auth.py`)
  - POST `/api/auth/login`
  - 이메일/비밀번호 검증
  - JWT 토큰 발급
- [ ] Token 스키마 생성 (`backend/app/schemas/auth.py`)
  - TokenResponse (access_token, token_type)

### FE
- [ ] 로그인 폼 컴포넌트 (`frontend/src/components/auth/LoginForm.tsx`)
  - email, password 입력 필드
- [ ] 로그인 API 호출 함수 (`frontend/src/lib/api/auth.ts`)
- [ ] 토큰 저장 로직 (localStorage 또는 cookie)

### Kernel
- N/A

---

## Feature 4: 인증 미들웨어 및 보호된 엔드포인트

### BE
- [ ] 현재 사용자 인증 의존성 함수 (`backend/app/dependencies/auth.py`)
  - get_current_user: JWT 토큰 검증 및 사용자 정보 반환
  - Authorization 헤더에서 Bearer 토큰 추출
- [ ] 보호된 엔드포인트 예시 생성
  - 인증 필요한 API에 `Depends(get_current_user)` 적용

### FE
- [ ] API 요청 인터셉터 (`frontend/src/lib/api/client.ts`)
  - axios 또는 fetch wrapper
  - 자동으로 Authorization 헤더에 토큰 추가

### Kernel
- N/A

---

## Feature 5: 사용자 정보 조회 API

### BE
- [ ] 현재 로그인된 사용자 정보 조회 API (`backend/app/routers/users.py`)
  - GET `/api/users/me`
  - 인증된 사용자의 정보 반환
- [ ] 사용자 프로필 수정 API (선택)
  - PUT `/api/users/me`

### FE
- [ ] 사용자 정보 조회 API 호출 함수 (`frontend/src/lib/api/user.ts`)

### Kernel
- N/A

---

## Feature 6: 로그인/회원가입 페이지 UI

### BE
- N/A

### FE
- [ ] 로그인 페이지 (`frontend/src/app/login/page.tsx`)
  - LoginForm 컴포넌트 배치
  - 회원가입 페이지 링크
- [ ] 회원가입 페이지 (`frontend/src/app/register/page.tsx`)
  - RegisterForm 컴포넌트 배치
  - 로그인 페이지 링크
- [ ] Tailwind CSS 스타일링
  - 반응형 디자인
  - 에러 메시지 표시

### Kernel
- N/A

---

## Feature 7: 프론트엔드 인증 상태 관리

### BE
- N/A

### FE
- [ ] 인증 Context 생성 (`frontend/src/contexts/AuthContext.tsx`)
  - 현재 사용자 상태 관리
  - login, logout, register 함수 제공
- [ ] 인증 Hook (`frontend/src/hooks/useAuth.ts`)
  - AuthContext 사용을 위한 커스텀 훅
- [ ] 앱 루트에 AuthProvider 적용 (`frontend/src/app/layout.tsx`)

### Kernel
- N/A

---

## Feature 8: 로그아웃 기능

### BE
- [ ] 로그아웃 API (선택사항)
  - POST `/api/auth/logout`
  - 토큰 블랙리스트 관리 (필요 시)

### FE
- [ ] 로그아웃 함수 구현 (`frontend/src/contexts/AuthContext.tsx`)
  - 로컬 토큰 제거
  - 사용자 상태 초기화
  - 로그인 페이지로 리다이렉트
- [ ] 로그아웃 버튼/메뉴 추가
  - 네비게이션 바 또는 사용자 메뉴

### Kernel
- N/A

---

## Feature 9: 보호된 페이지 라우팅

### BE
- N/A

### FE
- [ ] Protected Route 컴포넌트 (`frontend/src/components/auth/ProtectedRoute.tsx`)
  - 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
- [ ] 미들웨어 설정 (`frontend/src/middleware.ts`, 선택사항)
  - Next.js 미들웨어를 통한 인증 체크
- [ ] 보호된 페이지 예시 생성
  - 대시보드 또는 마이페이지

### Kernel
- N/A

---

## 추가 고려사항

### 보안
- [ ] CORS 설정 확인 (`backend/app/main.py`)
- [ ] 환경변수로 JWT SECRET_KEY 관리
- [ ] HTTPS 사용 (프로덕션)
- [ ] Rate limiting 적용 (로그인 시도 제한)

### 테스팅
- [ ] BE: 인증 API 테스트 작성
- [ ] FE: 로그인/회원가입 폼 테스트

### 문서화
- [ ] API 문서 업데이트 (Swagger)
- [ ] README에 로그인 기능 사용법 추가
