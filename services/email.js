// Sends transactional email through Resend (https://resend.com) when RESEND_API_KEY is set.
// Without a key (local dev) the message is printed to the server console instead, so the
// reset / verification links can still be copied from the terminal.
//
// Env: RESEND_API_KEY, EMAIL_FROM (e.g. "VivasayiMart <no-reply@yourdomain.com>"), APP_URL
const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.RESEND_API_KEY) {
        console.log(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
        return { sent: false, dev: true };
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'VivasayiMart <onboarding@resend.dev>',
            to: [to],
            subject,
            text,
            html
        })
    });
    if (!res.ok) {
        throw new Error(`Email provider error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    return { sent: true };
};

const sendVerificationEmail = (user, token) => {
    const link = `${appUrl()}/verify-email/${token}`;
    return sendEmail({
        to: user.email,
        subject: 'Verify your VivasayiMart email',
        text: `Hi ${user.name},\n\nPlease verify your email by opening this link (valid for 24 hours):\n${link}\n`,
        html: `<p>Hi ${user.name},</p><p>Please verify your email (valid for 24 hours):</p><p><a href="${link}">Verify email</a></p>`
    });
};

const sendPasswordResetEmail = (user, token) => {
    const link = `${appUrl()}/reset-password/${token}`;
    return sendEmail({
        to: user.email,
        subject: 'Reset your VivasayiMart password',
        text: `Hi ${user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${link}\n\nIf you did not ask for this, ignore this email.\n`,
        html: `<p>Hi ${user.name},</p><p>Use this link to set a new password (valid for 1 hour):</p><p><a href="${link}">Reset password</a></p><p>If you did not ask for this, ignore this email.</p>`
    });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
