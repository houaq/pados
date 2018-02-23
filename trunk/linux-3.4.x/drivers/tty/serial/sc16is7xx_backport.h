#ifndef SC16IS7XX_BACKPORT_H
#define SC16IS7XX_BACKPORT_H

#include <linux/version.h>

#define PORT_SC16IS7XX		108

#if LINUX_VERSION_CODE < KERNEL_VERSION(3,5,0)
#include <linux/ratelimit.h>

#define dev_level_ratelimited(dev_level, dev, fmt, ...)			\
do {									\
	static DEFINE_RATELIMIT_STATE(_rs,				\
				      DEFAULT_RATELIMIT_INTERVAL,	\
				      DEFAULT_RATELIMIT_BURST);		\
	if (__ratelimit(&_rs))						\
		dev_level(dev, fmt, ##__VA_ARGS__);			\
} while (0)

#define dev_emerg_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_emerg, dev, fmt, ##__VA_ARGS__)
#define dev_alert_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_alert, dev, fmt, ##__VA_ARGS__)
#define dev_crit_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_crit, dev, fmt, ##__VA_ARGS__)
#define dev_err_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_err, dev, fmt, ##__VA_ARGS__)
#define dev_warn_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_warn, dev, fmt, ##__VA_ARGS__)
#define dev_notice_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_notice, dev, fmt, ##__VA_ARGS__)
#define dev_info_ratelimited(dev, fmt, ...)				\
	dev_level_ratelimited(dev_info, dev, fmt, ##__VA_ARGS__)


#if defined(CONFIG_DYNAMIC_DEBUG) || defined(DEBUG)
#define dev_dbg_ratelimited(dev, fmt, ...)				\
do {									\
	static DEFINE_RATELIMIT_STATE(_rs,				\
				      DEFAULT_RATELIMIT_INTERVAL,	\
				      DEFAULT_RATELIMIT_BURST);		\
	DEFINE_DYNAMIC_DEBUG_METADATA(descriptor, fmt);			\
	if (unlikely(descriptor.flags & _DPRINTK_FLAGS_PRINT) &&	\
	    __ratelimit(&_rs))						\
		__dynamic_pr_debug(&descriptor, pr_fmt(fmt),		\
				   ##__VA_ARGS__);			\
} while (0)
#else
#define dev_dbg_ratelimited(dev, fmt, ...)			\
	no_printk(KERN_DEBUG pr_fmt(fmt), ##__VA_ARGS__)
#endif /* dynamic debug */
#endif /* <= 3.5 */

#if LINUX_VERSION_CODE < KERNEL_VERSION(3,9,0)
#define tty_flip_buffer_push(port) tty_flip_buffer_push((port)->tty)
#define tty_insert_flip_string(port, chars, size) tty_insert_flip_string((port)->tty, chars, size)


/**
 *  * enum uart_pm_state - power states for UARTs
 *   * @UART_PM_STATE_ON: UART is powered, up and operational
 *    * @UART_PM_STATE_OFF: UART is powered off
 *     * @UART_PM_STATE_UNDEFINED: sentinel
 *      */
enum uart_pm_state {
	UART_PM_STATE_ON = 0,
	UART_PM_STATE_OFF = 3, /* number taken from ACPI */
	UART_PM_STATE_UNDEFINED,
};

#endif

#define TIOCGRS485      0x542E
#ifndef TIOCSRS485
#define TIOCSRS485      0x542F
#endif

/**
 * the following gpio irq stuffs were taken from driver/char/ralink_gpio.c
 * XXX: only GPIO 0 ~ 31 supported
 */
#include <ralink/ralink_gpio.h>

extern irqreturn_t ralink_gpio_irq_handler(int irq, void *dev_id);

static void inline
ralink_gpio_irq_clear(int pin)
{
	*(volatile u32 *)(RALINK_REG_PIOINT) = cpu_to_le32((1<<pin));
}

static void inline
ralink_gpio_int_enabled(int pin)
{
	/* set gpio as input */
	u32 tmp = le32_to_cpu(*(volatile u32 *)(RALINK_REG_PIODIR));
	tmp &= ~(1 << pin);
	*(volatile u32 *)(RALINK_REG_PIODIR) = cpu_to_le32(tmp);
	
	/* enable falling edge trigger and disable others */
	tmp = le32_to_cpu(*(volatile u32 *)(RALINK_REG_PIOFENA));
	tmp |=  (1 << pin);
	*(volatile u32 *)(RALINK_REG_PIOFENA) = cpu_to_le32(tmp);
	
	tmp = le32_to_cpu(*(volatile u32 *)(RALINK_REG_PIORENA));
	tmp &= ~(1 << pin);
	*(volatile u32 *)(RALINK_REG_PIORENA) = cpu_to_le32(tmp);
	
	tmp = le32_to_cpu(*(volatile u32 *)(RALINK_REG_PIOHENA));
	tmp &= ~(1 << pin);
	*(volatile u32 *)(RALINK_REG_PIOHENA) = cpu_to_le32(tmp);
	
	tmp = le32_to_cpu(*(volatile u32 *)(RALINK_REG_PIOLENA));
	tmp &= ~(1 << pin);
	*(volatile u32 *)(RALINK_REG_PIOLENA) = cpu_to_le32(tmp);
	
	/* clear and enable interrupt */
	ralink_gpio_irq_clear(pin);
	*(volatile u32 *)(RALINK_INTENA) = cpu_to_le32(RALINK_INTCTL_PIO);
}

static int inline
ralink_gpio_int_status(int pin)
{
	u32 ralink_gpio_intp     = le32_to_cpu(*(volatile u32 *)(RALINK_REG_PIOINT));

	ralink_gpio_irq_clear(pin);
	
	return (ralink_gpio_intp & RALINK_GPIO(pin));
}

#endif
