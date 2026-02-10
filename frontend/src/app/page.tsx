'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HealthStatus {
  status: string;
  message: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setHealth({ status: 'error', message: '백엔드 연결 실패' });
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Module 5
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Next.js + FastAPI + SQLite
        </p>

        <div className="border-t pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            백엔드 상태
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-lg ${
                health?.status === 'ok'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              <p className="font-medium">
                {health?.status === 'ok' ? '연결됨' : '연결 실패'}
              </p>
              <p className="text-sm mt-1">{health?.message}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            시스템 모니터링
          </h2>
          <Link
            href="/metrics"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition text-center"
          >
            📊 System Metrics
          </Link>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            사용자 인증
          </h2>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition text-center"
            >
              회원가입
            </Link>
            <Link
              href="/login"
              className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg font-medium hover:bg-indigo-50 transition text-center"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
