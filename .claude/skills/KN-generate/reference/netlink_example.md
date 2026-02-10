# netlink_example — Netlink 소켓 기반 데이터 노출 패턴

## 핵심 구조

커널에서 유저스페이스로 **비동기 메시지 전송**. 고속 이벤트 스트리밍에 최적.
BE 서버가 Netlink 소켓을 열어 실시간으로 수신 가능.

## 커널 측 코드 패턴

```c
#include <linux/netlink.h>
#include <net/sock.h>

#define NETLINK_PKTLOG 31  /* 사용자 정의 프로토콜 번호 */

static struct sock *nl_sk;

static void send_to_userspace(const char *msg, int len)
{
	struct sk_buff *skb;
	struct nlmsghdr *nlh;

	skb = nlmsg_new(len, GFP_ATOMIC);
	if (!skb)
		return;

	nlh = nlmsg_put(skb, 0, 0, NLMSG_DONE, len, 0);
	memcpy(nlmsg_data(nlh), msg, len);
	nlmsg_multicast(nl_sk, skb, 0, 1, GFP_ATOMIC);
}

static int __init mod_init(void)
{
	struct netlink_kernel_cfg cfg = { .groups = 1 };

	nl_sk = netlink_kernel_create(&init_net, NETLINK_PKTLOG, &cfg);
	if (!nl_sk)
		return -ENOMEM;
	return 0;
}

static void __exit mod_exit(void)
{
	netlink_kernel_release(nl_sk);
}
```

## 유저스페이스 수신 (Python 예시)

```python
import socket
import struct

sock = socket.socket(socket.AF_NETLINK, socket.SOCK_DGRAM, 31)
sock.bind((0, 1))  # pid=0, group=1

while True:
    data = sock.recv(4096)
    # nlmsghdr(16bytes) 이후가 payload
    payload = data[16:]
    print(payload.decode())
```

## BE 연동 힌트

Python/Node BE 서버에서 Netlink 소켓을 직접 수신하여 WebSocket으로 브라우저에 푸시 가능.
`/proc` polling 대비 지연시간이 훨씬 짧다.