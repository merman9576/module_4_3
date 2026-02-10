# common_build_errors — 자주 발생하는 빌드 에러와 수정 방법

## 1. implicit declaration of function

```
error: implicit declaration of function 'proc_create'
```

**원인:** 헤더 누락
**수정:** `#include <linux/proc_fs.h>` 추가

## 2. unknown type name 'struct proc_ops'

```
error: unknown type name 'struct proc_ops'
```

**원인:** 커널 5.6 미만에서는 `proc_ops` 대신 `file_operations` 사용
**수정:**

```c
/* 커널 버전 분기 */
#if LINUX_VERSION_CODE >= KERNEL_VERSION(5, 6, 0)
static const struct proc_ops my_ops = {
	.proc_open = my_open,
	.proc_read = seq_read,
};
#else
static const struct file_operations my_ops = {
	.open = my_open,
	.read = seq_read,
};
#endif
```

## 3. passing argument from incompatible pointer type

```
warning: passing argument 1 of 'nf_register_net_hook' from incompatible pointer type
```

**원인:** 구버전 API `nf_register_hook` 사용
**수정:** `nf_register_net_hook(&init_net, &nfho)` 로 변경 (커널 4.13+)

## 4. 'struct nf_hook_ops' has no member named 'owner'

```
error: 'struct nf_hook_ops' has no member named 'owner'
```

**원인:** 커널 4.13 이후 `.owner` 필드 제거됨
**수정:** `.owner = THIS_MODULE` 라인 삭제

## 5. modpost: missing MODULE_LICENSE

```
WARNING: modpost: missing MODULE_LICENSE()
```

**원인:** 라이선스 선언 누락
**수정:** 소스 하단에 `MODULE_LICENSE("GPL");` 추가