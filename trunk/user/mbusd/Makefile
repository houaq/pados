SRC_NAME=mbusd-0.2.3

THISDIR = $(shell pwd)

CFLAGS += -O2 -ffunction-sections -fdata-sections
LDFLAGS += -Wl,--gc-sections

all: config_test
	$(MAKE) -C $(SRC_NAME)

config_test:
	( if [ -f ./config_done ]; then \
		echo "the same configuration"; \
	else \
		make configure && touch config_done; \
	fi )

configure:
	( cd $(SRC_NAME) ; \
	./configure \
		--prefix=/usr \
		--enable-shared=no \
		--enable-static=no \
		--disable-debug \
		--disable-library \
		--disable-ldconfig \
		--disable-mount-helper \
		--with-fuse=internal \
		--host=$(HOST_TARGET) \
		--build=$(HOST_BUILD) ; \
	)

clean:
	if [ -f $(SRC_NAME)/Makefile ] ; then \
		$(MAKE) -C $(SRC_NAME) distclean ; \
	fi ; \
	rm -f config_done

romfs:
	$(ROMFSINST) $(THISDIR)/mbusd-0.2.3/src/mbusd /usr/sbin/mbusd
	$(ROMFSINST) /www/mbusd.asp
	$(ROMFSINST) $(THISDIR)/mbusd.sh /usr/sbin/mbusd.sh
