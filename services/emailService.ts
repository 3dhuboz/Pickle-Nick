import emailjs from '@emailjs/browser';
import { AppSettings, Order } from '../types';

export const EmailService = {
    sendOrderConfirmation: async (order: Order, settings: AppSettings) => {
        const config = settings.emailConfig;
        if (!config || !config.enabled || !config.serviceId || !config.templateId || !config.publicKey) {
            console.warn("EmailJS not configured or disabled. Skipping order confirmation email.");
            return false;
        }

        try {
            const templateParams = {
                to_email: order.customerEmail,
                to_name: order.customerName,
                order_id: order.id,
                order_total: `$${order.total.toFixed(2)}`,
                order_status: order.status,
                admin_email: config.adminEmail,
                message: `Thank you for your order! Your order #${order.id.slice(-8)} has been received and is currently ${order.status}.`
            };

            const response = await emailjs.send(
                config.serviceId,
                config.templateId,
                templateParams,
                config.publicKey
            );

            console.log('SUCCESS!', response.status, response.text);
            return true;
        } catch (err) {
            console.error('FAILED...', err);
            return false;
        }
    },

    sendTrackingUpdate: async (order: Order, settings: AppSettings) => {
        const config = settings.emailConfig;
        if (!config || !config.enabled || !config.serviceId || !config.templateId || !config.publicKey) {
            console.warn("EmailJS not configured or disabled. Skipping tracking email.");
            return false;
        }

        try {
            const trackingLink = order.trackingNumber 
                ? `${settings.shippingConfig?.trackingBaseUrl}${order.trackingNumber}`
                : 'Local Pickup';

            const templateParams = {
                to_email: order.customerEmail,
                to_name: order.customerName,
                order_id: order.id,
                order_total: `$${order.total.toFixed(2)}`,
                order_status: order.status,
                admin_email: config.adminEmail,
                message: `Great news! Your order #${order.id.slice(-8)} has shipped. Track it here: ${trackingLink}`
            };

            const response = await emailjs.send(
                config.serviceId,
                config.templateId,
                templateParams,
                config.publicKey
            );

            console.log('SUCCESS!', response.status, response.text);
            return true;
        } catch (err) {
            console.error('FAILED...', err);
            return false;
        }
    }
};
