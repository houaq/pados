#!/bin/sh

SVC_NAME="mbusd"


func_start()
{

	enable=`nvram get mbusd_enable`
	if [ $enable = 0 ]; then 
		killall mbusd
		return 0
	fi
	echo -n "正在启动 $SVC_NAME:."


	mbusd_dev=`nvram get mbusd_dev`
	mbusd_port=`nvram get mbusd_port`
	mbusd_baud=`nvram get mbusd_baud`

	mbusd -p $mbusd_dev -s $mbusd_baud -P $mbusd_port &
}

func_start

