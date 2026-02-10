from pydantic import BaseModel, Field
from datetime import datetime


class CPUMetrics(BaseModel):
    """CPU 메트릭 응답 스키마"""
    timestamp: datetime = Field(..., description="메트릭 수집 시각")
    cpu_percent: float = Field(..., description="CPU 사용률 (%)", ge=0, le=100)
    cpu_count: int = Field(..., description="논리 CPU 코어 수", gt=0)
    cpu_freq: float = Field(..., description="현재 CPU 주파수 (MHz)", ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2026-02-10T12:00:00",
                "cpu_percent": 45.5,
                "cpu_count": 8,
                "cpu_freq": 2400.0
            }
        }


class MemoryMetrics(BaseModel):
    """Memory 메트릭 응답 스키마"""
    timestamp: datetime = Field(..., description="메트릭 수집 시각")
    memory_percent: float = Field(..., description="메모리 사용률 (%)", ge=0, le=100)
    memory_available_mb: float = Field(..., description="사용 가능한 메모리 (MB)", ge=0)
    memory_total_mb: float = Field(..., description="전체 메모리 (MB)", gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2026-02-10T12:00:00",
                "memory_percent": 65.2,
                "memory_available_mb": 8192.5,
                "memory_total_mb": 16384.0
            }
        }


class DiskMetrics(BaseModel):
    """Disk 메트릭 응답 스키마"""
    timestamp: datetime = Field(..., description="메트릭 수집 시각")
    disk_percent: float = Field(..., description="디스크 사용률 (%)", ge=0, le=100)
    disk_free_gb: float = Field(..., description="남은 디스크 공간 (GB)", ge=0)
    disk_total_gb: float = Field(..., description="전체 디스크 용량 (GB)", gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2026-02-10T12:00:00",
                "disk_percent": 42.8,
                "disk_free_gb": 128.5,
                "disk_total_gb": 256.0
            }
        }


class NetworkMetrics(BaseModel):
    """Network 메트릭 응답 스키마"""
    timestamp: datetime = Field(..., description="메트릭 수집 시각")
    bytes_sent_mb: float = Field(..., description="송신 바이트 (MB)", ge=0)
    bytes_recv_mb: float = Field(..., description="수신 바이트 (MB)", ge=0)
    packets_sent: int = Field(..., description="송신 패킷 수", ge=0)
    packets_recv: int = Field(..., description="수신 패킷 수", ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2026-02-10T12:00:00",
                "bytes_sent_mb": 1024.5,
                "bytes_recv_mb": 2048.8,
                "packets_sent": 150000,
                "packets_recv": 250000
            }
        }
