# debugfs_example — debugfs 기반 데이터 노출 패턴

## 핵심 구조

`/sys/kernel/debug/` 하위에 파일을 생성하여 커널 데이터를 노출한다.
개발/디버깅 용도에 적합하며 프로덕션에서는 비권장.

## 코드 패턴

```c
#include <linux/debugfs.h>

static struct dentry *dbg_dir;
static u64 pkt_count;

/* 패킷 카운트를 debugfs로 노출 */
static int __init mod_init(void)
{
	dbg_dir = debugfs_create_dir("netfilter_mod", NULL);
	if (!dbg_dir)
		return -ENOMEM;

	debugfs_create_u64("pkt_count", 0444, dbg_dir, &pkt_count);
	return 0;
}

static void __exit mod_exit(void)
{
	debugfs_remove_recursive(dbg_dir);
}
```

## 사용법

```bash
$ cat /sys/kernel/debug/netfilter_mod/pkt_count
42
```

## 장단점

- 장점: 코드가 매우 간결, 기본 타입(u64, bool 등) 자동 지원
- 단점: 마운트 필요(`mount -t debugfs none /sys/kernel/debug`), 보안 제한적