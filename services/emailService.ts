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

const LOGO_URL = 'https://picklenick.au/logo.jpg';

const emailWrapper = (content: string, brandName: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${brandName}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0ebe2;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a1a;padding:32px;text-align:center;">
            <img src="${LOGO_URL}" alt="${brandName}" width="80" height="80" style="border-radius:12px;display:block;margin:0 auto 16px;object-fit:cover;"/>
            <p style="margin:0;color:#a08060;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Handcrafted Pickles &amp; Preserves</p>
          </td>
        </tr>

        <!-- Body -->
        ${content}

        <!-- Footer -->
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 6px;color:#a08060;font-size:13px;font-weight:600;">${brandName}</p>
            <p style="margin:0;color:#5a4a3a;font-size:11px;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const orderConfirmationHtml = (customerName: string, orderId: string, total: string, brandName: string, extras?: { shippingMethod?: string; shippingCost?: string }) =>
  emailWrapper(`
    <!-- Greeting -->
    <tr>
      <td style="padding:40px 40px 24px;">
        <h1 style="margin:0 0 8px;color:#1a1a1a;font-size:24px;font-weight:700;">Order Confirmed!</h1>
        <p style="margin:0;color:#6b5744;font-size:15px;line-height:1.6;">Hi <strong>${customerName.split(' ')[0]}</strong>, thanks for your order. We're getting it ready for you.</p>
      </td>
    </tr>

    <!-- Order Summary Card -->
    <tr>
      <td style="padding:0 40px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f4ee;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px 12px;">
              <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a08060;font-weight:700;">Order Summary</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:10px 0;color:#6b5744;font-size:14px;border-top:1px solid #e8e0d4;">Order Number</td>
                  <td style="padding:10px 0;color:#1a1a1a;font-size:14px;font-weight:700;text-align:right;font-family:monospace;border-top:1px solid #e8e0d4;">#${orderId.slice(-8).toUpperCase()}</td>
                </tr>
                ${extras?.shippingMethod ? `<tr>
                  <td style="padding:10px 0;color:#6b5744;font-size:14px;border-top:1px solid #e8e0d4;">Shipping</td>
                  <td style="padding:10px 0;color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #e8e0d4;">${extras.shippingMethod === 'express' ? 'Express' : 'Standard'}${extras.shippingCost ? ' &mdash; ' + extras.shippingCost : ''}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:14px 0 16px;color:#6b5744;font-size:15px;font-weight:700;border-top:1px solid #e8e0d4;">Total Paid</td>
                  <td style="padding:14px 0 16px;color:#bc4b35;font-size:20px;font-weight:700;text-align:right;border-top:1px solid #e8e0d4;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- What's Next -->
    <tr>
      <td style="padding:0 40px 40px;">
        <p style="margin:0;color:#8a7060;font-size:13px;line-height:1.7;">We'll send you another email with tracking information as soon as your order ships. If you have any questions, just reply to this email.</p>
      </td>
    </tr>
  `, brandName);

const shippingUpdateHtml = (customerName: string, orderId: string, total: string, trackingNumber: string | null, trackingLink: string | null, brandName: string) =>
  emailWrapper(`
    <!-- Shipped Banner -->
    <tr>
      <td style="background:#2d5a3d;padding:24px 40px;text-align:center;">
        <p style="margin:0 0 4px;color:#7dd4a0;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Your Order Has Shipped</p>
        <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">It's on its way, ${customerName.split(' ')[0]}!</p>
      </td>
    </tr>

    <!-- Message -->
    <tr>
      <td style="padding:40px 40px 24px;">
        <p style="margin:0;color:#6b5744;font-size:15px;line-height:1.7;">Great news — your Pickle Nick order has been packed with care and handed off to the carrier. ${trackingNumber ? 'Use the tracking number below to follow its journey.' : 'Your order is on its way.'}</p>
      </td>
    </tr>

    ${trackingNumber ? `
    <!-- Tracking Card -->
    <tr>
      <td style="padding:0 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f4ee;border-radius:12px;text-align:center;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a08060;font-weight:700;">Tracking Number</p>
              <p style="margin:8px 0 20px;font-size:22px;font-weight:700;color:#1a1a1a;font-family:monospace;letter-spacing:2px;">${trackingNumber}</p>
              ${trackingLink ? `<a href="${trackingLink}" style="display:inline-block;background:#2d5a3d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;letter-spacing:0.5px;">Track My Package</a>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''}

    <!-- Order Reference -->
    <tr>
      <td style="padding:0 40px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f4ee;border-radius:12px;">
          <tr>
            <td style="padding:16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:#6b5744;font-size:14px;">Order Reference</td>
                  <td style="color:#1a1a1a;font-size:14px;font-weight:700;text-align:right;font-family:monospace;">#${orderId.slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="color:#6b5744;font-size:14px;padding-top:10px;border-top:1px solid #e8e0d4;">Order Total</td>
                  <td style="color:#bc4b35;font-size:16px;font-weight:700;text-align:right;padding-top:10px;border-top:1px solid #e8e0d4;">${total}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `, brandName);

export const EmailService = {
    sendOrderConfirmation: async (order: Order, settings: AppSettings): Promise<boolean> => {
        const config = settings.emailConfig;
        if (!config?.enabled) {
            console.warn("Email not configured or disabled. Skipping order confirmation.");
            return false;
        }

        const endpoint = config.emailProvider === 'smtp' ? (config.smtpEndpoint || '/api/send-email') : '/api/send-email';
        const brandName = config.fromName || 'Pickle Nick';
        try {
            return await sendEmail(endpoint, {
                to: order.customerEmail,
                subject: `Order Confirmed — #${order.id.slice(-8).toUpperCase()}`,
                html: orderConfirmationHtml(
                    order.customerName,
                    order.id,
                    `$${order.total.toFixed(2)}`,
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
        } catch (e: any) {
            console.error('Order confirmation email failed:', e?.message);
            return false;
        }
    },

    sendTrackingUpdate: async (order: Order, settings: AppSettings): Promise<boolean> => {
        const config = settings.emailConfig;
        if (!config?.enabled) {
            console.warn("Email not configured or disabled. Skipping tracking email.");
            return false;
        }

        const trackingNumber = order.trackingNumber || null;
        const trackingLink = trackingNumber
            ? `${settings.shippingConfig?.trackingBaseUrl || ''}${trackingNumber}`
            : null;

        const endpoint = config.emailProvider === 'smtp' ? (config.smtpEndpoint || '/api/send-email') : '/api/send-email';
        const brandName = config.fromName || 'Pickle Nick';
        try {
        return await sendEmail(endpoint, {
            to: order.customerEmail,
            subject: `Your Order Has Shipped — #${order.id.slice(-8).toUpperCase()}`,
            html: shippingUpdateHtml(
                order.customerName,
                order.id,
                `$${order.total.toFixed(2)}`,
                trackingNumber,
                trackingLink,
                brandName
            ),
            fromName: brandName,
            fromEmail: config.fromEmail,
            bcc: config.adminEmail,
            resendApiKey: config.emailProvider !== 'smtp' ? config.resendApiKey : undefined,
            smtp: config.emailProvider === 'smtp' ? { host: config.smtpHost, port: config.smtpPort, user: config.smtpUser, pass: config.smtpPass, secure: config.smtpSecure } : undefined
        });
        } catch (e: any) {
            console.error('Tracking update email failed:', e?.message);
            return false;
        }
    },

    sendTestEmail: async (settings: AppSettings): Promise<boolean> => {
        const config = settings.emailConfig;
        if (!config?.adminEmail) return false;

        const endpoint = config.emailProvider === 'smtp' ? (config.smtpEndpoint || '/api/send-email') : '/api/send-email';
        return sendEmail(endpoint, {
            to: config.adminEmail,
            subject: `${config.fromName || 'Pickle Nick'} — Email Test`,
            html: emailWrapper(`
              <tr><td style="padding:48px 40px;text-align:center;">
                <p style="margin:0 0 8px;font-size:32px;">✅</p>
                <h2 style="margin:0 0 12px;color:#1a1a1a;font-size:22px;font-weight:700;">Email is Working!</h2>
                <p style="margin:0 0 4px;color:#6b5744;font-size:15px;line-height:1.6;">Your Pickle Nick email is correctly configured.</p>
                <p style="margin:16px 0 0;color:#a08060;font-size:12px;">Sent at ${new Date().toLocaleString()}</p>
              </td></tr>
            `, config.fromName || 'Pickle Nick'),
            fromName: config.fromName,
            fromEmail: config.fromEmail,
            resendApiKey: config.emailProvider !== 'smtp' ? config.resendApiKey : undefined,
            smtp: config.emailProvider === 'smtp' ? { host: config.smtpHost, port: config.smtpPort, user: config.smtpUser, pass: config.smtpPass, secure: config.smtpSecure } : undefined
        });
    }
};
