// Sends transactional email (signup verification, password reset) through Gmail's SMTP,
// authenticated as pixelforgenetworks@gmail.com via an App Password (see .env.example for
// how to create one).
const nodemailer = require('nodemailer');

const transporter = process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

// User-supplied (their own display name), so escape it before it lands in the HTML body.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

// Shared chrome for every Forge email: mirrors the app's palette (styles.css :root) and
// voice — dark ink header, mono uppercase eyebrow, coral call-to-action, paper card body.
// Both templates below build on this so a future palette tweak only happens in one place.
function emailShell({ eyebrow, heading, bodyText, buttonLabel, buttonUrl, footnote }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)} — Forge</title>
</head>
<body style="margin:0;padding:0;background:#dfe5df;font-family:'Manrope',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#dfe5df;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:#f7f8f4;border-radius:4px;overflow:hidden;">

<!-- header -->
<tr><td style="background:#14231f;padding:32px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:40px;height:40px;background:#d9ef54;border-radius:8px;text-align:center;vertical-align:middle;font:800 16px 'DM Mono',Menlo,monospace;color:#14231f;">F</td>
<td style="padding-left:10px;vertical-align:middle;font:800 15px 'Manrope',Arial,sans-serif;letter-spacing:3px;color:#ffffff;">FORGE</td>
</tr></table>
<p style="margin:14px 0 0;font:500 10px 'DM Mono',Menlo,monospace;letter-spacing:1.5px;text-transform:uppercase;color:#9db0a4;">Your training, measured</p>
</td></tr>

<!-- body -->
<tr><td style="padding:36px 28px 8px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="width:7px;height:7px;background:#d9ef54;border-radius:50%;"></td>
<td style="padding-left:7px;font:500 10px 'DM Mono',Menlo,monospace;letter-spacing:1.2px;text-transform:uppercase;color:#76837d;">${escapeHtml(eyebrow)}</td>
</tr></table>
<h1 style="margin:14px 0 0;font-size:24px;line-height:1.2;letter-spacing:-.6px;font-weight:800;color:#14231f;">${escapeHtml(heading)}</h1>
<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#41504a;">${bodyText}</p>
</td></tr>

<!-- button -->
<tr><td style="padding:24px 28px 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td align="center" style="background:#ff765f;border-radius:3px;">
<a href="${buttonUrl}" style="display:block;padding:15px 20px;font:800 12px 'Manrope',Arial,sans-serif;letter-spacing:.4px;color:#ffffff;text-decoration:none;">${escapeHtml(buttonLabel)}</a>
</td>
</tr></table>
</td></tr>

<!-- fallback link -->
<tr><td style="padding:20px 28px 0;">
<p style="margin:0 0 6px;font-size:11px;color:#76837d;">Or paste this link into your browser:</p>
<p style="margin:0;font:11px 'DM Mono',Menlo,monospace;color:#41504a;word-break:break-all;">${buttonUrl}</p>
</td></tr>

<!-- divider + footnote -->
<tr><td style="padding:24px 28px 28px;">
<div style="border-top:1px solid #e5e9e3;padding-top:16px;">
<p style="margin:0;font-size:11px;line-height:1.6;color:#76837d;">${footnote}</p>
</div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendVerificationEmail({ to, name, verifyUrl }) {
  if (!transporter) {
    // No credentials configured yet — don't block signup, just make the link visible
    // in the server console so development can continue without Gmail set up.
    console.warn(`[mailer] GMAIL_APP_PASSWORD is not set. Verification link for ${to}:\n  ${verifyUrl}`);
    return;
  }

  const safeName = escapeHtml(name || 'there');
  await transporter.sendMail({
    from: `"Forge" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Confirm your Forge account',
    text: `Hi ${name || 'there'},\n\nConfirm your email to finish setting up Forge:\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create a Forge account, you can ignore this email.`,
    html: emailShell({
      eyebrow: 'Account verification',
      heading: 'Confirm your email',
      bodyText: `Hi ${safeName}, welcome to Forge. Confirm your email address to finish setting up your account and start logging workouts.`,
      buttonLabel: 'Verify my email →',
      buttonUrl: verifyUrl,
      footnote: "This link expires in 24 hours. If you didn't create a Forge account, you can safely ignore this email.",
    }),
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!transporter) {
    console.warn(`[mailer] GMAIL_APP_PASSWORD is not set. Password reset link for ${to}:\n  ${resetUrl}`);
    return;
  }

  const safeName = escapeHtml(name || 'there');
  await transporter.sendMail({
    from: `"Forge" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Reset your Forge password',
    text: `Hi ${name || 'there'},\n\nSomeone asked to reset the password on this Forge account. If that was you:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.`,
    html: emailShell({
      eyebrow: 'Password reset',
      heading: 'Reset your password',
      bodyText: `Hi ${safeName}, someone asked to reset the password on this Forge account. If that was you, choose a new password below.`,
      buttonLabel: 'Reset my password →',
      buttonUrl: resetUrl,
      footnote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.",
    }),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
