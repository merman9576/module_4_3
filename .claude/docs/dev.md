# Feature 1 개발 가이드: 사용자 데이터 모델 및 인증 스키마

> 로그인 기능의 기반 인프라 구축 (User 모델, 스키마, 비밀번호 해싱)

---

## 🎯 목표

- User 모델 및 스키마 생성
- bcrypt 기반 비밀번호 해싱
- 백엔드-프론트엔드 타입 정의
- 데이터베이스 테이블 자동 생성

---

## 📦 1. 패키지 설치

```bash
cd backend
.venv\Scripts\activate
uv pip install passlib[bcrypt] pydantic[email]
```

---

## 🔧 2. 구현 체크리스트

### Backend

- [ ] **보안 유틸리티** (`backend/app/utils/security.py`)
  ```python
  from passlib.context import CryptContext

  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

  def hash_password(password: str) -> str:
      return pwd_context.hash(password)

  def verify_password(plain_password: str, hashed_password: str) -> bool:
      return pwd_context.verify(plain_password, hashed_password)
  ```

- [ ] **User 모델** (`backend/app/models/user.py`)
  ```python
  from sqlalchemy import Column, Integer, String, DateTime
  from sqlalchemy.sql import func
  from app.database import Base

  class User(Base):
      __tablename__ = "users"

      id = Column(Integer, primary_key=True, index=True)
      email = Column(String(255), unique=True, nullable=False, index=True)
      username = Column(String(50), nullable=False)
      hashed_password = Column(String(255), nullable=False)
      created_at = Column(DateTime(timezone=True), server_default=func.now())
      updated_at = Column(DateTime(timezone=True), onupdate=func.now())
  ```

- [ ] **User 모델 등록** (`backend/app/models/__init__.py`)
  ```python
  from app.models.example import Example
  from app.models.user import User  # 추가

  __all__ = ["Example", "User"]  # User 추가
  ```

- [ ] **User 스키마** (`backend/app/schemas/user.py`)
  ```python
  from datetime import datetime
  from pydantic import BaseModel, EmailStr, Field

  class UserCreate(BaseModel):
      email: EmailStr
      username: str = Field(..., min_length=2, max_length=50)
      password: str = Field(..., min_length=8, max_length=100)

  class UserLogin(BaseModel):
      email: EmailStr
      password: str

  class UserResponse(BaseModel):
      id: int
      email: str
      username: str
      created_at: datetime
      updated_at: datetime | None

      model_config = {"from_attributes": True}
  ```

- [ ] **User 스키마 등록** (`backend/app/schemas/__init__.py`)
  ```python
  from app.schemas.example import ExampleCreate, ExampleResponse
  from app.schemas.user import UserCreate, UserLogin, UserResponse  # 추가

  __all__ = [
      "ExampleCreate", "ExampleResponse",
      "UserCreate", "UserLogin", "UserResponse"  # 추가
  ]
  ```

### Frontend

- [ ] **TypeScript 타입** (`frontend/src/types/user.ts`)
  ```typescript
  export interface User {
    id: number;
    email: string;
    username: string;
    created_at: string;
    updated_at: string | null;
  }

  export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
  }

  export interface LoginRequest {
    email: string;
    password: string;
  }
  ```

---

## ✅ 3. 검증

### 3.1. 서버 시작 및 테이블 생성
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

### 3.2. 테이블 확인
```bash
sqlite3 backend/app.db
.tables  # 출력에 'users' 포함 확인
.schema users
.exit
```

### 3.3. Swagger UI 확인
- URL: http://localhost:8000/docs
- `UserCreate`, `UserLogin`, `UserResponse` 스키마 확인
- `UserResponse`에 password 필드 없음 확인

### 3.4. 비밀번호 해싱 테스트
```python
from backend.app.utils.security import hash_password, verify_password

hashed = hash_password("test123")
print(verify_password("test123", hashed))  # True
print(verify_password("wrong", hashed))    # False
```

---

## 🔐 보안 체크리스트

✅ 비밀번호 bcrypt 해싱 (salt 자동)
✅ 이메일 형식 검증 (EmailStr)
✅ 이메일 unique constraint
✅ 비밀번호 최소 8자
✅ UserResponse에서 password 제외

---

## 📂 생성/수정 파일 목록

**새 파일:**
- `backend/app/utils/__init__.py`
- `backend/app/utils/security.py`
- `backend/app/models/user.py`
- `backend/app/schemas/user.py`
- `frontend/src/types/user.ts`

**수정 파일:**
- `backend/app/models/__init__.py`
- `backend/app/schemas/__init__.py`
- `backend/requirements.txt` (passlib, pydantic[email] 추가)

---

## 🚀 다음 단계

- **Feature 2**: 회원가입 API (`POST /api/auth/register`)
- **Feature 3**: 로그인 API + JWT 토큰 발급
- **Feature 6**: 로그인/회원가입 UI 페이지

---

## 💡 참고사항

- 기존 Example 모델 패턴 준수
- `Base.metadata.create_all()` 자동 테이블 생성
- `model_config = {"from_attributes": True}`: Pydantic v2 문법
- 프론트엔드 path alias: `@/types/user` 사용 가능

**예상 소요 시간:** 1-1.5시간
