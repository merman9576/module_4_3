/**
 * 사용자 정보 (백엔드 UserResponse와 대응)
 */
export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string; // ISO 8601 형식
  updated_at: string | null;
}

/**
 * 회원가입 요청 데이터
 */
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

/**
 * 로그인 요청 데이터
 */
export interface LoginRequest {
  email: string;
  password: string;
}
