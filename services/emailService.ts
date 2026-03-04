import { AppSettings, Order } from '../types';

const sendEmail = async (
    endpoint: string,
    payload: { to: string; subject: string; html: string; fromName?: string; fromEmail?: string; bcc?: string; resendApiKey?: string; smtp?: { host?: string; port?: number; user?: string; pass?: string; secure?: string } }
): Promise<boolean> => {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) {
        throw new Error(data.error || data.debug || 'Unknown error from email server');
    }
    return true;
};

const orderEmailHtml = (customerName: string, orderId: string, total: string, bodyText: string, brandName: string, extras?: { shippingMethod?: string; shippingCost?: string }) => `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f0e6;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e1d8;">
    <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
      <h1 style="color:#f5f0e6;font-size:28px;margin:0;letter-spacing:2px;">${brandName}</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="color:#4e342e;font-size:16px;margin:0 0 8px;">Hello <strong>${customerName}</strong>,</p>
      <p style="color:#4e342e;font-size:15px;line-height:1.6;margin:0 0 24px;">${bodyText}</p>
      <table width="100%" style="background:#f5f0e6;border-radius:8px;padding:16px;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 16px;color:#8d6e63;font-size:13px;">Order</td>
          <td style="padding:8px 16px;color:#1a1a1a;font-weight:bold;text-align:right;font-size:13px;">#${orderId.slice(-8).toUpperCase()}</td>
        </tr>
        ${extras?.shippingMethod ? `<tr>
          <td style="padding:8px 16px;color:#8d6e63;font-size:13px;">Shipping</td>
          <td style="padding:8px 16px;color:#1a1a1a;font-weight:bold;text-align:right;font-size:13px;">${extras.shippingMethod === 'express' ? '⚡ Express' : '📦 Standard'}${extras.shippingCost ? ' — ' + extras.shippingCost : ''}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 16px;color:#8d6e63;font-size:13px;">Total</td>
          <td style="padding:8px 16px;color:#bc4b35;font-weight:bold;text-align:right;font-size:16px;">${total}</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="background:#1a1a1a;padding:16px 32px;text-align:center;">
      <p style="color:#8d6e63;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
    </td></tr>
  </table>
</body></html>`;

export const EmailService = {
    sendOrderConfirmation: async (order: Order, settings: AppSettings): Promise<boolean> => {
        const config = settings.emailConfig;
        if (!config?.enabled) {
            console.warn("Email not configured or disabled. Skipping order confirmation.");
            return false;
        }

        const endpoint = config.emailProvider === 'smtp' ? (config.smtpEndpoint || '/api/send-email') : '/api/send-email';
        const brandName = config.fromName || 'Pickle Nick';
        return sendEmail(endpoint, {
            to: order.customerEmail,
            subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()}`,
            html: orderEmailHtml(
                order.customerName,
                order.id,
                `$${order.total.toFixed(2)}`,
                `Thank you for your order! Your order has been received and is currently <strong>${order.status}</strong>. We'll notify you when it ships.`,
                brandName,
                {
                    shippingMethod: order.shippingMethod,
                    shippingCost: order.shippingCost != null ? (order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`) : undefined
                }
            ),
            fromName: brandName,
            fromEmail: config.fromEmail,
            bcc: config.adminEmail,
            resendApiKey: config.emailProvider !== 'smtp' ? config.resendApiKey : undefined,
            smtp: config.emailProvider === 'smtp' ? { host: config.smtpHost, port: config.smtpPort, user: config.smtpUser, pass: config.smtpPass, secure: config.smtpSecure } : undefined
        });
    },

    sendTrackingUpdate: async (order: Order, settings: AppSettings): Promise<boolean> => {
        const config = settings.emailConfig;
        if (!config?.enabled) {
            console.warn("Email not configured or disabled. Skipping tracking email.");
            return false;
        }

        const trackingLink = order.trackingNumber
            ? `${settings.shippingConfig?.trackingBaseUrl || ''}${order.trackingNumber}`
            : null;

        const trackingHtml = trackingLink
            ? `Your order has shipped! <a href="${trackingLink}" style="color:#26a69a;font-weight:bold;">Track your package here</a>.`
            : `Your order has shipped and is on its way! (Local pickup — no tracking number)`;

        const endpoint = config.emailProvider === 'smtp' ? (config.smtpEndpoint || '/api/send-email') : '/api/send-email';
        const brandName = config.fromName || 'Pickle Nick';
        return sendEmail(endpoint, {
            to: order.customerEmail,
            subject: `Your Order Has Shipped — #${order.id.slice(-8).toUpperCase()}`,
            html: orderEmailHtml(
                order.customerName,
                order.id,
                `$${order.total.toFixed(2)}`,
                trackingHtml,
                brandName
            ),
            fromName: brandName,
            fromEmail: config.fromEmail,
            bcc: config.adminEmail,
            resendApiKey: config.emailProvider !== 'smtp' ? config.resendApiKey : undefined,
            smtp: config.emailProvider === 'smtp' ? { host: config.smtpHost, port: config.smtpPort, user: config.smtpUser, pass: config.smtpPass, secure: config.smtpSecure } : undefined
        });
    },

    sendTestEmail: async (settings: AppSettings): Promise<boolean> => {
        const config = settings.emailConfig;
        if (!config?.adminEmail) return false;

        const endpoint = config.emailProvider === 'smtp' ? (config.smtpEndpoint || '/api/send-email') : '/api/send-email';
        return sendEmail(endpoint, {
            to: config.adminEmail,
            subject: `${config.fromName || 'Pickle Nick'} — Email Test`,
            html: `<div style="font-family:Georgia,serif;padding:32px;background:#f5f0e6;border-radius:12px;text-align:center;">
                <h2 style="color:#1a1a1a;">Email Configuration Working</h2>
                <p style="color:#4e342e;">If you received this, your email is correctly configured.</p>
                <p style="color:#8d6e63;font-size:12px;">Sent at ${new Date().toLocaleString()}</p>
            </div>`,
            fromName: config.fromName,
            fromEmail: config.fromEmail,
            resendApiKey: config.emailProvider !== 'smtp' ? config.resendApiKey : undefined,
            smtp: config.emailProvider === 'smtp' ? { host: config.smtpHost, port: config.smtpPort, user: config.smtpUser, pass: config.smtpPass, secure: config.smtpSecure } : undefined
        });
    }
};
