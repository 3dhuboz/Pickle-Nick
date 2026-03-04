import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { to, subject, html, fromName, fromEmail, bcc, resendApiKey, smtp } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, html' });
  }

  const from = `"${fromName || 'Pickle Nick'}" <${fromEmail || 'noreply@picklenick.au'}>`;

  // ── Resend (preferred) ──────────────────────────────────────────────────
  if (resendApiKey) {
    try {
      const payload: any = { from, to: Array.isArray(to) ? to : [to], subject, html };
      if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resendData = await resendRes.json();
      if (resendRes.ok) {
        return res.status(200).json({ success: true, message: 'Email sent via Resend', id: resendData.id });
      }
      return res.status(500).json({
        success: false,
        error: resendData.message || 'Resend delivery failed.',
        debug: JSON.stringify(resendData)
      });
    } catch (err: any) {
      console.error('Resend error:', err);
      return res.status(500).json({ success: false, error: 'Resend request failed.', debug: err?.message });
    }
  }

  // ── SMTP fallback ────────────────────────────────────────────────────────
  const host = smtp?.host || 'mail.picklenick.au';
  const port = smtp?.port || 465;
  const user = smtp?.user || fromEmail || 'noreply@picklenick.au';
  const pass = smtp?.pass || '';
  const secure = smtp?.secure === 'tls' ? false : true;

  if (!pass) {
    return res.status(400).json({ success: false, error: 'No API key or SMTP password provided. Configure email in Admin Settings.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host, port, secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions: nodemailer.SendMailOptions = { from, to, subject, html };
    if (bcc) mailOptions.bcc = bcc;

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Email sent via SMTP' });
  } catch (err: any) {
    console.error('SMTP error:', err);
    return res.status(500).json({
      success: false,
      error: 'Mail delivery failed. Check SMTP configuration in Admin Settings.',
      debug: err?.message || 'Unknown error'
    });
  }
}
