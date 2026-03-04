import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { to, subject, html, fromName, fromEmail, bcc, smtp } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, html' });
  }

  // SMTP config from request body (sent by frontend from admin settings)
  const host = smtp?.host || 'mail.picklenick.au';
  const port = smtp?.port || 465;
  const user = smtp?.user || fromEmail || 'noreply@picklenick.au';
  const pass = smtp?.pass || '';
  const secure = smtp?.secure === 'tls' ? false : true; // ssl=true, tls=false (STARTTLS)

  if (!pass) {
    return res.status(400).json({ success: false, error: 'SMTP password is required. Configure it in Admin Settings → Email.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName || 'Pickle Nick'}" <${fromEmail || user}>`,
      to,
      subject,
      html,
    };

    if (bcc) mailOptions.bcc = bcc;

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (err: any) {
    console.error('Email send error:', err);
    return res.status(500).json({
      success: false,
      error: 'Mail delivery failed. Check SMTP configuration in admin Settings.',
      debug: err?.message || 'Unknown error'
    });
  }
}
