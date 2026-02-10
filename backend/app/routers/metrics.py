from fastapi import APIRouter
from datetime import datetime
import psutil

from app.schemas.metrics import CPUMetrics, MemoryMetrics, DiskMetrics, NetworkMetrics

router = APIRouter(
    prefix="/api/metrics",
    tags=["metrics"]
)


@router.get("/cpu", response_model=CPUMetrics)
def get_cpu_metrics():
    """
    현재 CPU 메트릭을 반환합니다.

    Returns:
        CPUMetrics: CPU 사용률, 코어 수, 주파수 정보
    """
    # CPU 사용률 측정 (1초 간격)
    cpu_percent = psutil.cpu_percent(interval=1)

    # 논리 CPU 코어 수
    cpu_count = psutil.cpu_count(logical=True)

    # CPU 주파수 정보 (MHz)
    cpu_freq_info = psutil.cpu_freq()
    cpu_freq = cpu_freq_info.current if cpu_freq_info else 0.0

    return CPUMetrics(
        timestamp=datetime.now(),
        cpu_percent=cpu_percent,
        cpu_count=cpu_count,
        cpu_freq=cpu_freq
    )


@router.get("/memory", response_model=MemoryMetrics)
def get_memory_metrics():
    """
    현재 Memory 메트릭을 반환합니다.

    Returns:
        MemoryMetrics: 메모리 사용률, 사용 가능한 메모리, 전체 메모리 정보
    """
    # 메모리 정보 조회
    memory = psutil.virtual_memory()

    # 메모리 사용률 (%)
    memory_percent = memory.percent

    # 사용 가능한 메모리 (MB)
    memory_available_mb = memory.available / (1024 * 1024)

    # 전체 메모리 (MB)
    memory_total_mb = memory.total / (1024 * 1024)

    return MemoryMetrics(
        timestamp=datetime.now(),
        memory_percent=memory_percent,
        memory_available_mb=memory_available_mb,
        memory_total_mb=memory_total_mb
    )


@router.get("/disk", response_model=DiskMetrics)
def get_disk_metrics():
    """
    현재 Disk 메트릭을 반환합니다.

    Returns:
        DiskMetrics: 디스크 사용률, 남은 공간, 전체 용량 정보
    """
    # 디스크 정보 조회 (루트 디렉토리 기준)
    disk = psutil.disk_usage('/')

    # 디스크 사용률 (%)
    disk_percent = disk.percent

    # 남은 디스크 공간 (GB)
    disk_free_gb = disk.free / (1024 ** 3)

    # 전체 디스크 용량 (GB)
    disk_total_gb = disk.total / (1024 ** 3)

    return DiskMetrics(
        timestamp=datetime.now(),
        disk_percent=disk_percent,
        disk_free_gb=disk_free_gb,
        disk_total_gb=disk_total_gb
    )


@router.get("/network", response_model=NetworkMetrics)
def get_network_metrics():
    """
    현재 Network 메트릭을 반환합니다.

    Returns:
        NetworkMetrics: 송수신 바이트, 송수신 패킷 수 정보
    """
    # 네트워크 I/O 통계 조회
    net_io = psutil.net_io_counters()

    # 송신 바이트 (MB)
    bytes_sent_mb = net_io.bytes_sent / (1024 * 1024)

    # 수신 바이트 (MB)
    bytes_recv_mb = net_io.bytes_recv / (1024 * 1024)

    # 송신 패킷 수
    packets_sent = net_io.packets_sent

    # 수신 패킷 수
    packets_recv = net_io.packets_recv

    return NetworkMetrics(
        timestamp=datetime.now(),
        bytes_sent_mb=bytes_sent_mb,
        bytes_recv_mb=bytes_recv_mb,
        packets_sent=packets_sent,
        packets_recv=packets_recv
    )
