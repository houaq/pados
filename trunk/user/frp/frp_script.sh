#frpc.ini
[common]
server_addr = x.x.x.x
server_port = 7000

[secret_ssh]
type = stcp
# 只有 sk 一致的用户才能访问到此服务
sk = abcdefg
local_ip = 127.0.0.1
local_port = 22
