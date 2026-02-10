// 메트릭 데이터 포인트 타입
export interface MetricDataPoint {
  timestamp: number;
  value: number;      // 그래프 표시용 (delta 또는 원본 값)
  rawValue?: number;  // 누적 값 저장용 (Network 메트릭의 delta 계산용)
}

// CPU 메트릭 응답 타입
export interface CPUMetrics {
  timestamp: string;
  cpu_percent: number;
  cpu_count: number;
  cpu_freq: number | null;
}

// Memory 메트릭 응답 타입
export interface MemoryMetrics {
  timestamp: string;
  memory_percent: number;
  memory_available_mb: number;
  memory_total_mb: number;
}

// Disk 메트릭 응답 타입
export interface DiskMetrics {
  timestamp: string;
  disk_percent: number;
  disk_free_gb: number;
  disk_total_gb: number;
}

// Network 메트릭 응답 타입
export interface NetworkMetrics {
  timestamp: string;
  bytes_sent_mb: number;
  bytes_recv_mb: number;
  packets_sent: number;
  packets_recv: number;
}
