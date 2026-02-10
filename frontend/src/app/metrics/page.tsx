'use client';

import { useEffect, useState, useMemo } from 'react';
import MetricsChart from '@/components/MetricsChart';
import { MetricDataPoint, CPUMetrics, MemoryMetrics, DiskMetrics, NetworkMetrics } from '@/types/metrics';
import Link from 'next/link';

// 24시간 = 86400초, 5초 간격 = 17280 포인트
const MAX_HISTORY_HOURS = 24;
const MAX_DATA_POINTS = (MAX_HISTORY_HOURS * 60 * 60) / 5; // 17280

const LOCALSTORAGE_KEY = 'metrics_history_v1';

interface MetricsHistoryData {
  cpu: MetricDataPoint[];
  memory: MetricDataPoint[];
  disk: MetricDataPoint[];
  networkSent: MetricDataPoint[];
  networkRecv: MetricDataPoint[];
  lastSaved: number;
}

export default function MetricsPage() {
  const [cpuHistory, setCpuHistory] = useState<MetricDataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MetricDataPoint[]>([]);
  const [diskHistory, setDiskHistory] = useState<MetricDataPoint[]>([]);
  const [networkSentHistory, setNetworkSentHistory] = useState<MetricDataPoint[]>([]);
  const [networkRecvHistory, setNetworkRecvHistory] = useState<MetricDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<number>(5000); // 기본값: 5초 (밀리초)
  const [viewWindowHours, setViewWindowHours] = useState<number>(2); // 기본값: 2시간 (0.5 = 30분 지원)
  const [dataPointCount, setDataPointCount] = useState<number>(0); // 배치 저장용 카운터
  const [restoredCount, setRestoredCount] = useState<number>(0); // 복원된 데이터 개수

  // LocalStorage에서 데이터 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        const data: MetricsHistoryData = JSON.parse(saved);

        // 24시간 이내 데이터만 필터링
        const cutoff = Date.now() - MAX_HISTORY_HOURS * 60 * 60 * 1000;

        const filteredCpu = (data.cpu || []).filter(p => p.timestamp > cutoff);
        const filteredMemory = (data.memory || []).filter(p => p.timestamp > cutoff);
        const filteredDisk = (data.disk || []).filter(p => p.timestamp > cutoff);
        const filteredNetworkSent = (data.networkSent || []).filter(p => p.timestamp > cutoff);
        const filteredNetworkRecv = (data.networkRecv || []).filter(p => p.timestamp > cutoff);

        setCpuHistory(filteredCpu);
        setMemoryHistory(filteredMemory);
        setDiskHistory(filteredDisk);
        setNetworkSentHistory(filteredNetworkSent);
        setNetworkRecvHistory(filteredNetworkRecv);

        const totalRestored = filteredCpu.length + filteredMemory.length + filteredDisk.length + filteredNetworkSent.length + filteredNetworkRecv.length;
        setRestoredCount(totalRestored);
      }
    } catch (err) {
      console.error('LocalStorage 복원 실패:', err);
    }
  }, []);

  // LocalStorage에 데이터 저장 (배치 처리: 5개 데이터마다 또는 10초마다)
  useEffect(() => {
    // 데이터가 없으면 저장하지 않음
    if (cpuHistory.length === 0 && memoryHistory.length === 0 && diskHistory.length === 0 && networkSentHistory.length === 0 && networkRecvHistory.length === 0) {
      return;
    }

    // 5개 데이터마다 저장
    if (dataPointCount > 0 && dataPointCount % 5 === 0) {
      const historyData: MetricsHistoryData = {
        cpu: cpuHistory,
        memory: memoryHistory,
        disk: diskHistory,
        networkSent: networkSentHistory,
        networkRecv: networkRecvHistory,
        lastSaved: Date.now(),
      };

      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(historyData));
      } catch (err) {
        console.error('LocalStorage 저장 실패:', err);
      }
    }
  }, [cpuHistory, memoryHistory, diskHistory, networkSentHistory, networkRecvHistory, dataPointCount]);

  // 10초마다 강제 저장
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (cpuHistory.length === 0 && memoryHistory.length === 0 && diskHistory.length === 0 && networkSentHistory.length === 0 && networkRecvHistory.length === 0) {
        return;
      }

      const historyData: MetricsHistoryData = {
        cpu: cpuHistory,
        memory: memoryHistory,
        disk: diskHistory,
        networkSent: networkSentHistory,
        networkRecv: networkRecvHistory,
        lastSaved: Date.now(),
      };

      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(historyData));
      } catch (err) {
        console.error('LocalStorage 저장 실패:', err);
      }
    }, 10000); // 10초

    return () => clearInterval(saveInterval);
  }, [cpuHistory, memoryHistory, diskHistory, networkSentHistory, networkRecvHistory]);

  // 뷰 윈도우 필터링 (메모이제이션)
  const getFilteredData = useMemo(() => {
    return (data: MetricDataPoint[]) => {
      const now = Date.now();
      const windowMs = viewWindowHours * 60 * 60 * 1000;
      const cutoff = now - windowMs;
      return data.filter(p => p.timestamp >= cutoff);
    };
  }, [viewWindowHours]);

  // CPU 메트릭 가져오기
  const fetchCPUMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/cpu');
      if (!response.ok) {
        throw new Error('API 호출 실패');
      }
      const data: CPUMetrics = await response.json();

      // 새 데이터 포인트 생성
      const newDataPoint: MetricDataPoint = {
        timestamp: new Date(data.timestamp).getTime(),
        value: data.cpu_percent,
      };

      // 히스토리 업데이트 (최대 MAX_DATA_POINTS 유지, 24시간)
      setCpuHistory((prev) => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-MAX_DATA_POINTS);
      });

      setDataPointCount(prev => prev + 1);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLoading(false);
    }
  };

  // Memory 메트릭 가져오기
  const fetchMemoryMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/memory');
      if (!response.ok) {
        throw new Error('Memory API 호출 실패');
      }
      const data: MemoryMetrics = await response.json();

      // 새 데이터 포인트 생성
      const newDataPoint: MetricDataPoint = {
        timestamp: new Date(data.timestamp).getTime(),
        value: data.memory_percent,
      };

      // 히스토리 업데이트 (최대 MAX_DATA_POINTS 유지, 24시간)
      setMemoryHistory((prev) => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-MAX_DATA_POINTS);
      });

      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLoading(false);
    }
  };

  // Disk 메트릭 가져오기
  const fetchDiskMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/disk');
      if (!response.ok) {
        throw new Error('Disk API 호출 실패');
      }
      const data: DiskMetrics = await response.json();

      // 새 데이터 포인트 생성
      const newDataPoint: MetricDataPoint = {
        timestamp: new Date(data.timestamp).getTime(),
        value: data.disk_percent,
      };

      // 히스토리 업데이트 (최대 MAX_DATA_POINTS 유지, 24시간)
      setDiskHistory((prev) => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-MAX_DATA_POINTS);
      });

      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLoading(false);
    }
  };

  // Network 메트릭 가져오기 (Delta 계산)
  const fetchNetworkMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/network');
      if (!response.ok) {
        throw new Error('Network API 호출 실패');
      }
      const data: NetworkMetrics = await response.json();

      const timestamp = new Date(data.timestamp).getTime();

      // 현재 누적 값
      const currentSent = data.bytes_sent_mb;
      const currentRecv = data.bytes_recv_mb;

      // 이전 측정값 가져오기 (rawValue에서)
      const prevSent = networkSentHistory.length > 0
        ? networkSentHistory[networkSentHistory.length - 1].rawValue || 0
        : 0;

      const prevRecv = networkRecvHistory.length > 0
        ? networkRecvHistory[networkRecvHistory.length - 1].rawValue || 0
        : 0;

      // Delta 계산 (음수 방지: 시스템 재시작 등)
      const deltaSent = Math.max(0, currentSent - prevSent);
      const deltaRecv = Math.max(0, currentRecv - prevRecv);

      // 송신 데이터 포인트 (delta + 누적 값 저장)
      const sentDataPoint: MetricDataPoint = {
        timestamp,
        value: deltaSent,        // 그래프에 표시할 delta
        rawValue: currentSent    // 다음 계산을 위한 누적 값
      };

      // 수신 데이터 포인트 (delta + 누적 값 저장)
      const recvDataPoint: MetricDataPoint = {
        timestamp,
        value: deltaRecv,        // 그래프에 표시할 delta
        rawValue: currentRecv    // 다음 계산을 위한 누적 값
      };

      // 히스토리 업데이트 (최대 MAX_DATA_POINTS 유지, 24시간)
      setNetworkSentHistory((prev) => {
        const updated = [...prev, sentDataPoint];
        return updated.slice(-MAX_DATA_POINTS);
      });

      setNetworkRecvHistory((prev) => {
        const updated = [...prev, recvDataPoint];
        return updated.slice(-MAX_DATA_POINTS);
      });

      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLoading(false);
    }
  };


  // 폴링 간격에 따라 주기적으로 데이터 가져오기
  useEffect(() => {
    fetchCPUMetrics(); // 초기 로드
    fetchMemoryMetrics(); // 초기 로드
    fetchDiskMetrics(); // 초기 로드
    fetchNetworkMetrics(); // 초기 로드

    const cpuInterval = setInterval(fetchCPUMetrics, pollingInterval);
    const memoryInterval = setInterval(fetchMemoryMetrics, pollingInterval);
    const diskInterval = setInterval(fetchDiskMetrics, pollingInterval);
    const networkInterval = setInterval(fetchNetworkMetrics, pollingInterval);

    return () => {
      clearInterval(cpuInterval);
      clearInterval(memoryInterval);
      clearInterval(diskInterval);
      clearInterval(networkInterval);
    };
  }, [pollingInterval]); // pollingInterval이 변경되면 재실행

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              System Metrics
            </h1>
            <p className="text-gray-600 mt-1">
              실시간 시스템 모니터링
            </p>
          </div>
          <Link
            href="/"
            className="bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition"
          >
            ← 홈으로
          </Link>
        </div>

        {/* 컨트롤 바 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* 좌측: 폴링 간격 + 시간 범위 */}
            <div className="flex items-center gap-4">
              {/* 폴링 간격 선택 드롭다운 */}
              <div className="flex items-center gap-2">
                <label htmlFor="polling-interval" className="text-sm font-medium text-gray-700">
                  폴링:
                </label>
                <select
                  id="polling-interval"
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5000}>5초</option>
                  <option value={10000}>10초</option>
                  <option value={30000}>30초</option>
                  <option value={60000}>60초</option>
                </select>
              </div>

              {/* 시간 범위 선택 드롭다운 */}
              <div className="flex items-center gap-2">
                <label htmlFor="view-window" className="text-sm font-medium text-gray-700">
                  시간 범위:
                </label>
                <select
                  id="view-window"
                  value={viewWindowHours}
                  onChange={(e) => setViewWindowHours(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0.5}>30분</option>
                  <option value={1}>1시간</option>
                  <option value={1.5}>1시간 30분</option>
                  <option value={2}>2시간</option>
                  <option value={2.5}>2시간 30분</option>
                  <option value={3}>3시간</option>
                  <option value={3.5}>3시간 30분</option>
                  <option value={4}>4시간</option>
                  <option value={4.5}>4시간 30분</option>
                  <option value={5}>5시간</option>
                  <option value={5.5}>5시간 30분</option>
                  <option value={6}>6시간</option>
                  <option value={8}>8시간</option>
                  <option value={10}>10시간</option>
                  <option value={12}>12시간</option>
                  <option value={18}>18시간</option>
                  <option value={24}>24시간</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <span>💡</span>
            <span>
              Tip: 시간 범위를 선택하여 그래프 기간 조정 |
              데이터는 최대 24시간 저장됨 |
              {restoredCount > 0 && ` LocalStorage에서 ${restoredCount}개 데이터 복원됨`}
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* 차트 그리드 - 2열 (자동 행) */}
        {!loading && (cpuHistory.length > 0 || memoryHistory.length > 0 || diskHistory.length > 0 || networkSentHistory.length > 0 || networkRecvHistory.length > 0) && (
          <div className="grid grid-cols-2 gap-6">
            {/* CPU 차트 */}
            {cpuHistory.length > 0 && (
              <MetricsChart
                data={getFilteredData(cpuHistory)}
                title="CPU Usage (%)"
                color="#3b82f6"
                unit="%"
                yDomain={[0, 100]}
              />
            )}

            {/* Memory 차트 */}
            {memoryHistory.length > 0 && (
              <MetricsChart
                data={getFilteredData(memoryHistory)}
                title="Memory Usage (%)"
                color="#10b981"
                unit="%"
                yDomain={[0, 100]}
              />
            )}

            {/* Disk 차트 */}
            {diskHistory.length > 0 && (
              <MetricsChart
                data={getFilteredData(diskHistory)}
                title="Disk Usage (%)"
                color="#f59e0b"
                unit="%"
                yDomain={[0, 100]}
              />
            )}

            {/* Network 차트 - 송신 (Delta) */}
            {networkSentHistory.length > 0 && (
              <MetricsChart
                data={getFilteredData(networkSentHistory)}
                title={`Network Sent (MB/${pollingInterval / 1000}s)`}
                color="#ef4444"
                unit="MB"
                yDomain={[0, 'auto']}
              />
            )}

            {/* Network 차트 - 수신 (Delta) */}
            {networkRecvHistory.length > 0 && (
              <MetricsChart
                data={getFilteredData(networkRecvHistory)}
                title={`Network Recv (MB/${pollingInterval / 1000}s)`}
                color="#8b5cf6"
                unit="MB"
                yDomain={[0, 'auto']}
              />
            )}
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && cpuHistory.length === 0 && memoryHistory.length === 0 && diskHistory.length === 0 && networkSentHistory.length === 0 && networkRecvHistory.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            데이터를 수집하는 중입니다...
          </div>
        )}
      </div>
    </main>
  );
}
