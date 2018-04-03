THISDIR = $(shell pwd)

all:

clean:

romfs:
	$(ROMFSINST) /www/frp.asp
	cp frpc $(INSTALLDIR)/usr/bin
	$(ROMFSINST)  -d $(THISDIR)/frp_script.sh /etc_ro/frp_script.sh
	$(ROMFSINST) $(THISDIR)/frp.sh /usr/sbin/frp.sh
