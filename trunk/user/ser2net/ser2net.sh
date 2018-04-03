#!/bin/sh

SVC_NAME="ser2net"


func_start()
{

	enable=`nvram get ser2net_enable`
	if [ $enable = 0 ]; then 
		killall ser2net
		return 0
	fi
	echo -n "正在启动 $SVC_NAME:."


	ser2net -c  /etc/storage/ser2net_script.sh &
}

func_start

