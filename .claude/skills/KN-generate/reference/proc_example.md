# proc_example — /proc 기반 데이터 노출 패턴

## 핵심 구조

`seq_file` 인터페이스를 사용하여 커널 데이터를 `/proc` 파일로 노출한다.

## 코드 패턴

```c
#include <linux/proc_fs.h>
#include <linux/seq_file.h>

#define PROC_NAME "pkt_log"
#define LOG_MAX 1024

struct pkt_entry {
	__be32 src_ip;
	__be16 dst_port;
	unsigned int pkt_size;
};

static struct pkt_entry log_buf[LOG_MAX];
static int log_idx;
static DEFINE_SPINLOCK(log_lock);

/* Netfilter 훅에서 호출 */
static void log_packet(struct sk_buff *skb)
{
	struct iphdr *iph = ip_hdr(skb);
	struct tcphdr *tcph = tcp_hdr(skb);

	spin_lock(&log_lock);
	log_buf[log_idx % LOG_MAX] = (struct pkt_entry){
		.src_ip   = iph->saddr,
		.dst_port = tcph->dest,
		.pkt_size = skb->len,
	};
	log_idx++;
	spin_unlock(&log_lock);
}

/* seq_file show 콜백 */
static int pkt_log_show(struct seq_file *m, void *v)
{
	int i;

	spin_lock(&log_lock);
	for (i = 0; i < min(log_idx, LOG_MAX); i++) {
		seq_printf(m, "%pI4 %u %u\n",
			   &log_buf[i].src_ip,
			   ntohs(log_buf[i].dst_port),
			   log_buf[i].pkt_size);
	}
	spin_unlock(&log_lock);
	return 0;
}

static int pkt_log_open(struct inode *inode, struct file *file)
{
	return single_open(file, pkt_log_show, NULL);
}

static const struct proc_ops pkt_log_ops = {
	.proc_open    = pkt_log_open,
	.proc_read    = seq_read,
	.proc_lseek   = seq_lseek,
	.proc_release = single_release,
};

/* module_init 에서 호출 */
proc_create(PROC_NAME, 0444, NULL, &pkt_log_ops);

/* module_exit 에서 호출 */
remove_proc_entry(PROC_NAME, NULL);
```

## 출력 포맷

```
192.168.1.100 443 1500
10.0.0.1 80 512
```

한 줄에 하나의 패킷: `src_ip dst_port pkt_size` (공백 구분)

## BE 연동 힌트

이 포맷은 BE에서 라인 단위로 읽어 split하면 바로 파싱 가능하다.