#!/bin/sh

SVC_NAME="frp"


func_start()
{

	enable=`nvram get frp_enable`
	if [ $enable = 0 ]; then 
		killall frp
		return 0
	fi
	echo -n "正在启动 $SVC_NAME:."


	frpc -c  /etc/storage/frp_script.sh &
}

func_start

