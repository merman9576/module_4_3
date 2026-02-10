/**
 * network_monitor.c - Netfilter 기반 네트워크 트래픽 모니터링 모듈
 *
 * Netfilter hooks(PRE_ROUTING, POST_ROUTING)를 사용하여
 * TCP/UDP 포트별 패킷 수와 바이트 수를 수집하고
 * /proc/net/traffic_stats 를 통해 JSON 형식으로 노출한다.
 *
 * 데이터 구조: 커널 해시 테이블 (port -> stats)
 * 동기화: spinlock
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/version.h>

/* Netfilter */
#include <linux/netfilter.h>
#include <linux/netfilter_ipv4.h>

/* Network headers */
#include <linux/ip.h>
#include <linux/tcp.h>
#include <linux/udp.h>
#include <linux/skbuff.h>

/* Proc filesystem */
#include <linux/proc_fs.h>
#include <linux/seq_file.h>

/* Data structures and synchronization */
#include <linux/hashtable.h>
#include <linux/slab.h>
#include <linux/spinlock.h>
#include <linux/atomic.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Kernel Agent");
MODULE_DESCRIPTION("Network Traffic Monitor using Netfilter");
MODULE_VERSION("1.0");

/* --------------------------------------------------------------------
 * Configuration
 * -------------------------------------------------------------------- */

#define HASH_BITS_SIZE		10	/* 2^10 = 1024 buckets */
#define MAX_TRACKED_PORTS	4096	/* prevent unbounded growth */
#define PROC_NAME		"traffic_stats"
#define PROC_PARENT		"net"

/* Protocol identifiers for internal use */
enum proto_type {
	PROTO_TCP = 0,
	PROTO_UDP = 1,
	PROTO_MAX
};

/* --------------------------------------------------------------------
 * Data Structures
 * -------------------------------------------------------------------- */

/**
 * struct traffic_stats - per-port packet/byte counters
 * @packets: number of packets observed
 * @bytes:   total bytes observed
 */
struct traffic_stats {
	unsigned long packets;
	unsigned long bytes;
};

/**
 * struct port_entry - hash table entry for a (proto, port) pair
 * @proto:  PROTO_TCP or PROTO_UDP
 * @port:   destination port number (host byte order)
 * @stats:  traffic counters
 * @node:   hash table linkage
 */
struct port_entry {
	u8  proto;
	u16 port;
	struct traffic_stats stats;
	struct hlist_node node;
};

/* Hash table: keyed by (proto << 16 | port) */
static DEFINE_HASHTABLE(port_hash, HASH_BITS_SIZE);

/* Protects port_hash and all port_entry instances */
static DEFINE_SPINLOCK(stats_lock);

/* Global totals (updated atomically for fast /proc reads) */
static atomic_long_t total_packets = ATOMIC_LONG_INIT(0);
static atomic_long_t total_bytes   = ATOMIC_LONG_INIT(0);

/* Current number of tracked (proto, port) pairs */
static unsigned int tracked_count;

/* Netfilter hook operations */
static struct nf_hook_ops nf_hooks[2];

/* Proc entry */
static struct proc_dir_entry *proc_entry;

/* --------------------------------------------------------------------
 * Hash Table Helpers
 * -------------------------------------------------------------------- */

/**
 * make_key() - combine protocol and port into a single hash key
 */
static inline u32 make_key(u8 proto, u16 port)
{
	return ((u32)proto << 16) | (u32)port;
}

/**
 * find_port_entry() - look up a port entry in the hash table
 *
 * Caller MUST hold stats_lock.
 */
static struct port_entry *find_port_entry(u8 proto, u16 port)
{
	struct port_entry *entry;
	u32 key = make_key(proto, port);

	hash_for_each_possible(port_hash, entry, node, key) {
		if (entry->proto == proto && entry->port == port)
			return entry;
	}
	return NULL;
}

/**
 * get_or_create_entry() - find or allocate a port entry
 *
 * Caller MUST hold stats_lock.
 * Returns NULL if allocation fails or MAX_TRACKED_PORTS reached.
 */
static struct port_entry *get_or_create_entry(u8 proto, u16 port)
{
	struct port_entry *entry;
	u32 key;

	entry = find_port_entry(proto, port);
	if (entry)
		return entry;

	/* Limit the number of tracked entries */
	if (tracked_count >= MAX_TRACKED_PORTS) {
		pr_warn_ratelimited("network_monitor: max tracked ports (%u) reached\n",
				    MAX_TRACKED_PORTS);
		return NULL;
	}

	entry = kmalloc(sizeof(*entry), GFP_ATOMIC);
	if (!entry)
		return NULL;

	entry->proto = proto;
	entry->port = port;
	entry->stats.packets = 0;
	entry->stats.bytes = 0;

	key = make_key(proto, port);
	hash_add(port_hash, &entry->node, key);
	tracked_count++;

	return entry;
}

/* --------------------------------------------------------------------
 * Packet Processing
 * -------------------------------------------------------------------- */

/**
 * process_packet() - extract port info and update statistics
 *
 * Called from Netfilter hook context (softirq).
 * Parses IP/TCP/UDP headers and updates the per-port hash entry.
 */
static void process_packet(struct sk_buff *skb)
{
	struct iphdr *iph;
	struct tcphdr *tcph;
	struct udphdr *udph;
	struct port_entry *entry;
	u8 proto;
	u16 src_port, dst_port;
	unsigned int pkt_len;

	if (!skb)
		return;

	/* Ensure we can read the IP header */
	iph = ip_hdr(skb);
	if (!iph)
		return;

	/* Only handle TCP and UDP */
	if (iph->protocol != IPPROTO_TCP && iph->protocol != IPPROTO_UDP)
		return;

	/* Packet length from IP header */
	pkt_len = ntohs(iph->tot_len);

	if (iph->protocol == IPPROTO_TCP) {
		proto = PROTO_TCP;

		/* Verify we can read the TCP header */
		if (!pskb_may_pull(skb, ip_hdrlen(skb) + sizeof(struct tcphdr)))
			return;

		/* Re-fetch iph after pskb_may_pull (may reallocate skb data) */
		iph = ip_hdr(skb);
		tcph = (struct tcphdr *)((unsigned char *)iph + ip_hdrlen(skb));
		src_port = ntohs(tcph->source);
		dst_port = ntohs(tcph->dest);
	} else {
		proto = PROTO_UDP;

		/* Verify we can read the UDP header */
		if (!pskb_may_pull(skb, ip_hdrlen(skb) + sizeof(struct udphdr)))
			return;

		/* Re-fetch iph after pskb_may_pull (may reallocate skb data) */
		iph = ip_hdr(skb);
		udph = (struct udphdr *)((unsigned char *)iph + ip_hdrlen(skb));
		src_port = ntohs(udph->source);
		dst_port = ntohs(udph->dest);
	}

	/* Update global totals (lock-free) */
	atomic_long_inc(&total_packets);
	atomic_long_add(pkt_len, &total_bytes);

	/* Update per-port stats under lock */
	spin_lock(&stats_lock);

	/* Track destination port */
	entry = get_or_create_entry(proto, dst_port);
	if (entry) {
		entry->stats.packets++;
		entry->stats.bytes += pkt_len;
	}

	/* Also track source port if different */
	if (src_port != dst_port) {
		entry = get_or_create_entry(proto, src_port);
		if (entry) {
			entry->stats.packets++;
			entry->stats.bytes += pkt_len;
		}
	}

	spin_unlock(&stats_lock);
}

/* --------------------------------------------------------------------
 * Netfilter Hook Callbacks
 * -------------------------------------------------------------------- */

/**
 * nf_hook_pre_routing() - hook for incoming packets
 */
static unsigned int nf_hook_pre_routing(void *priv,
					struct sk_buff *skb,
					const struct nf_hook_state *state)
{
	process_packet(skb);
	return NF_ACCEPT;
}

/**
 * nf_hook_post_routing() - hook for outgoing packets
 */
static unsigned int nf_hook_post_routing(void *priv,
					 struct sk_buff *skb,
					 const struct nf_hook_state *state)
{
	process_packet(skb);
	return NF_ACCEPT;
}

/* --------------------------------------------------------------------
 * /proc Interface (seq_file based, JSON output)
 * -------------------------------------------------------------------- */

/**
 * traffic_proc_show() - generate JSON output for /proc/net/traffic_stats
 *
 * Output format:
 * {
 *   "tcp": { "PORT": {"packets": N, "bytes": N}, ... },
 *   "udp": { "PORT": {"packets": N, "bytes": N}, ... },
 *   "total": { "packets": N, "bytes": N }
 * }
 */
static int traffic_proc_show(struct seq_file *m, void *v)
{
	struct port_entry *entry;
	unsigned int bkt;
	bool first_tcp = true;
	bool first_udp = true;
	unsigned long tot_pkts, tot_bytes;

	seq_puts(m, "{\n");

	spin_lock(&stats_lock);

	/* TCP section */
	seq_puts(m, "  \"tcp\": {\n");
	hash_for_each(port_hash, bkt, entry, node) {
		if (entry->proto != PROTO_TCP)
			continue;
		if (!first_tcp)
			seq_puts(m, ",\n");
		seq_printf(m, "    \"%u\": {\"packets\": %lu, \"bytes\": %lu}",
			   entry->port,
			   entry->stats.packets,
			   entry->stats.bytes);
		first_tcp = false;
	}
	if (!first_tcp)
		seq_putc(m, '\n');
	seq_puts(m, "  },\n");

	/* UDP section */
	seq_puts(m, "  \"udp\": {\n");
	hash_for_each(port_hash, bkt, entry, node) {
		if (entry->proto != PROTO_UDP)
			continue;
		if (!first_udp)
			seq_puts(m, ",\n");
		seq_printf(m, "    \"%u\": {\"packets\": %lu, \"bytes\": %lu}",
			   entry->port,
			   entry->stats.packets,
			   entry->stats.bytes);
		first_udp = false;
	}
	if (!first_udp)
		seq_putc(m, '\n');
	seq_puts(m, "  },\n");

	spin_unlock(&stats_lock);

	/* Total section (atomic reads, no lock needed) */
	tot_pkts = atomic_long_read(&total_packets);
	tot_bytes = atomic_long_read(&total_bytes);

	seq_printf(m, "  \"total\": {\n"
		      "    \"packets\": %lu,\n"
		      "    \"bytes\": %lu\n"
		      "  }\n", tot_pkts, tot_bytes);

	seq_puts(m, "}\n");

	return 0;
}

static int traffic_proc_open(struct inode *inode, struct file *file)
{
	return single_open(file, traffic_proc_show, NULL);
}

#if LINUX_VERSION_CODE >= KERNEL_VERSION(5, 6, 0)
static const struct proc_ops traffic_proc_ops = {
	.proc_open    = traffic_proc_open,
	.proc_read    = seq_read,
	.proc_lseek   = seq_lseek,
	.proc_release = single_release,
};
#else
static const struct file_operations traffic_proc_ops = {
	.owner   = THIS_MODULE,
	.open    = traffic_proc_open,
	.read    = seq_read,
	.llseek  = seq_lseek,
	.release = single_release,
};
#endif

/* --------------------------------------------------------------------
 * Module Init / Exit
 * -------------------------------------------------------------------- */

/**
 * cleanup_hash_table() - free all port entries from the hash table
 *
 * Called during module exit. No lock needed as hooks are already
 * unregistered by this point.
 */
static void cleanup_hash_table(void)
{
	struct port_entry *entry;
	struct hlist_node *tmp;
	unsigned int bkt;

	hash_for_each_safe(port_hash, bkt, tmp, entry, node) {
		hash_del(&entry->node);
		kfree(entry);
	}
	tracked_count = 0;
}

/**
 * network_monitor_init() - module initialization
 *
 * Registration order: hash table -> proc entry -> netfilter hooks
 * On failure, previously registered resources are cleaned up.
 */
static int __init network_monitor_init(void)
{
	int ret;

	/* Hash table is statically allocated, just init count */
	hash_init(port_hash);
	tracked_count = 0;

	pr_info("network_monitor: initializing (hash_bits=%d, max_ports=%d)\n",
		HASH_BITS_SIZE, MAX_TRACKED_PORTS);

	/* Create /proc/net/traffic_stats */
	proc_entry = proc_create(PROC_NAME, 0444,
				 init_net.proc_net, &traffic_proc_ops);
	if (!proc_entry) {
		pr_err("network_monitor: failed to create /proc/%s/%s\n",
		       PROC_PARENT, PROC_NAME);
		return -ENOMEM;
	}

	/* Register PRE_ROUTING hook */
	nf_hooks[0].hook     = nf_hook_pre_routing;
	nf_hooks[0].pf       = NFPROTO_IPV4;
	nf_hooks[0].hooknum  = NF_INET_PRE_ROUTING;
	nf_hooks[0].priority = NF_IP_PRI_FIRST;

	ret = nf_register_net_hook(&init_net, &nf_hooks[0]);
	if (ret < 0) {
		pr_err("network_monitor: failed to register PRE_ROUTING hook (err=%d)\n",
		       ret);
		goto err_remove_proc;
	}

	/* Register POST_ROUTING hook */
	nf_hooks[1].hook     = nf_hook_post_routing;
	nf_hooks[1].pf       = NFPROTO_IPV4;
	nf_hooks[1].hooknum  = NF_INET_POST_ROUTING;
	nf_hooks[1].priority = NF_IP_PRI_FIRST;

	ret = nf_register_net_hook(&init_net, &nf_hooks[1]);
	if (ret < 0) {
		pr_err("network_monitor: failed to register POST_ROUTING hook (err=%d)\n",
		       ret);
		goto err_unreg_pre;
	}

	pr_info("network_monitor: module loaded successfully\n");
	pr_info("network_monitor: monitoring at PRE_ROUTING + POST_ROUTING\n");
	pr_info("network_monitor: stats available at /proc/%s/%s\n",
		PROC_PARENT, PROC_NAME);

	return 0;

err_unreg_pre:
	nf_unregister_net_hook(&init_net, &nf_hooks[0]);
err_remove_proc:
	proc_remove(proc_entry);
	return ret;
}

/**
 * network_monitor_exit() - module cleanup
 *
 * Cleanup order (reverse of init):
 * netfilter hooks -> proc entry -> hash table
 */
static void __exit network_monitor_exit(void)
{
	unsigned int final_count = tracked_count;

	/* Unregister hooks first to stop new packets */
	nf_unregister_net_hook(&init_net, &nf_hooks[1]);
	nf_unregister_net_hook(&init_net, &nf_hooks[0]);

	/* Remove proc entry */
	proc_remove(proc_entry);

	/* Log before cleanup (tracked_count gets zeroed) */
	pr_info("network_monitor: module unloaded (tracked %u port entries)\n",
		final_count);
	pr_info("network_monitor: total packets=%ld, bytes=%ld\n",
		atomic_long_read(&total_packets),
		atomic_long_read(&total_bytes));

	/* Free all hash entries */
	cleanup_hash_table();
}

module_init(network_monitor_init);
module_exit(network_monitor_exit);
