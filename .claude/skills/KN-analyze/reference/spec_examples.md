# spec_examples — 노출 방식별 데이터 명세 생성 예시

## proc 방식 (가장 일반적)

소스에서 `seq_printf` 포맷 문자열을 추출하여 명세를 생성한다.

```c
/* 소스 코드 */
seq_printf(m, "%pI4 %u %u\n", &entry->src_ip, ntohs(entry->dst_port), entry->pkt_size);
```

→ 생성되는 명세:

```json
{
  "interface": { "type": "proc", "path": "/proc/pkt_log" },
  "fields": [
    { "name": "src_ip", "type": "string", "format": "IPv4" },
    { "name": "dst_port", "type": "integer", "range": "0-65535" },
    { "name": "pkt_size", "type": "integer", "unit": "bytes" }
  ],
  "delimiter": " ",
  "line_format": "{src_ip} {dst_port} {pkt_size}",
  "recommended_polling": "1s"
}
```

## netlink 방식

소스에서 전송하는 구조체를 분석하여 바이너리 포맷 명세를 생성한다.

```c
/* 소스 코드 */
struct pkt_event {
    __be32 src_ip;
    __be32 dst_ip;
    __be16 dst_port;
    __u16  pkt_size;
} __attribute__((packed));
```

→ 생성되는 명세:

```json
{
  "interface": { "type": "netlink", "protocol": 31 },
  "fields": [
    { "name": "src_ip", "type": "uint32", "byte_order": "big", "offset": 0 },
    { "name": "dst_ip", "type": "uint32", "byte_order": "big", "offset": 4 },
    { "name": "dst_port", "type": "uint16", "byte_order": "big", "offset": 8 },
    { "name": "pkt_size", "type": "uint16", "byte_order": "native", "offset": 10 }
  ],
  "total_size": 12,
  "be_parser_hint": "struct.unpack('!IIHH', data[:12])"
}
```

## debugfs 방식

`debugfs_create_*` 호출에서 변수 타입과 이름을 추출한다.

```c
/* 소스 코드 */
debugfs_create_u64("pkt_count", 0444, dbg_dir, &pkt_count);
debugfs_create_u64("drop_count", 0444, dbg_dir, &drop_count);
```

→ 생성되는 명세:

```json
{
  "interface": { "type": "debugfs", "base_path": "/sys/kernel/debug/netfilter_mod" },
  "fields": [
    { "name": "pkt_count", "type": "uint64", "path": "pkt_count" },
    { "name": "drop_count", "type": "uint64", "path": "drop_count" }
  ],
  "recommended_polling": "5s",
  "be_parser_hint": "각 파일을 개별 read하여 int() 변환"
}
```