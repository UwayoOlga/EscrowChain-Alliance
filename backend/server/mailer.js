import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// ── Build transporter from environment variables ──
// Supports any SMTP provider (Gmail, Sendgrid, Mailtrap, etc.)
// For local development with Mailtrap: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
// For Gmail: set SMTP_USER=your@gmail.com and SMTP_PASS=your-app-password (not your account password)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 2525,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
    },
});

const FROM_ADDRESS = process.env.SMTP_FROM || '"EscrowChain Alliance" <no-reply@escrowchain.rw>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ── Shared HTML email wrapper ──
function htmlWrapper(title, bodyHtml) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body  { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f5f7; margin: 0; padding: 0; }
            .wrap { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: #0a0a0a; padding: 32px 40px; }
            .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: -0.5px; }
            .header p  { color: #888; margin: 4px 0 0; font-size: 13px; }
            .body   { padding: 40px; color: #333; line-height: 1.7; }
            .body h2 { font-size: 20px; color: #0a0a0a; margin-bottom: 8px; }
            .detail { background: #f9f9f9; border-radius: 8px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #0a0a0a; }
            .detail p { margin: 4px 0; font-size: 14px; }
            .detail strong { color: #0a0a0a; }
            .btn { display: inline-block; background: #0a0a0a; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 24px; }
            .footer { background: #f4f5f7; padding: 20px 40px; font-size: 12px; color: #aaa; text-align: center; }
        </style>
    </head>
    <body>
        <div class="wrap">
            <div class="header">
                <h1>EscrowChain Alliance</h1>
                <p>Secure Smart Contract Leasing · Rwanda</p>
            </div>
            <div class="body">
                <h2>${title}</h2>
                ${bodyHtml}
            </div>
            <div class="footer">
                This is an automated notification from EscrowChain Alliance.<br>
                © ${new Date().getFullYear()} EscrowChain Alliance, Kigali, Rwanda.
            </div>
        </div>
    </body>
    </html>`;
}

// ── Safely send — never crash the calling request on mail failure ──
async function sendMail(to, subject, html) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[Mailer] SMTP credentials not configured. Skipping email to:', to);
        return;
    }
    try {
        await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });
        console.log(`[Mailer] ✅ Sent "${subject}" to ${to}`);
    } catch (err) {
        console.error('[Mailer] ❌ Failed to send email:', err.message);
    }
}

// ──────────────────────────────────────────────
//  Event: Tenant applied for a property
// ──────────────────────────────────────────────
export async function notifyLeaseRequested({ landlordEmail, landlordName, tenantName, propertyTitle, leaseId }) {
    const subject = `[EscrowChain] New Rental Application — ${propertyTitle}`;
    const html = htmlWrapper('New Rental Application Received', `
        <p>Hi ${landlordName},</p>
        <p>A tenant has submitted a new rental application for one of your properties.</p>
        <div class="detail">
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Applicant:</strong> ${tenantName}</p>
            <p><strong>Contract Reference:</strong> CT-${leaseId.substring(0, 8).toUpperCase()}</p>
        </div>
        <p>Please log into your dashboard to review the application and either accept or deny the tenant.</p>
        <a class="btn" href="${APP_URL}/leases">Review Application →</a>
    `);
    await sendMail(landlordEmail, subject, html);
}

// ──────────────────────────────────────────────
//  Event: Landlord approved the application
// ──────────────────────────────────────────────
export async function notifyLeaseApproved({ tenantEmail, tenantName, propertyTitle, leaseId, rentAmount }) {
    const subject = `[EscrowChain] Application Approved — ${propertyTitle}`;
    const html = htmlWrapper('Your Rental Application Was Approved! 🎉', `
        <p>Hi ${tenantName},</p>
        <p>Great news! Your rental application has been approved by the landlord. You may now sign the smart contract and lock your security deposit into escrow.</p>
        <div class="detail">
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Monthly Rent:</strong> RWF ${rentAmount}</p>
            <p><strong>Contract Reference:</strong> CT-${leaseId.substring(0, 8).toUpperCase()}</p>
        </div>
        <p>Connect your Cardano wallet and finalize the contract to secure your tenancy.</p>
        <a class="btn" href="${APP_URL}/leases">Sign Smart Contract →</a>
    `);
    await sendMail(tenantEmail, subject, html);
}

// ──────────────────────────────────────────────
//  Event: A dispute was filed on a lease
// ──────────────────────────────────────────────
export async function notifyDisputeFiled({ recipientEmail, recipientName, raisedByName, propertyTitle, caseId, reason }) {
    const subject = `[EscrowChain] Dispute Filed — CASE-${caseId.substring(0, 8).toUpperCase()}`;
    const html = htmlWrapper('A Dispute Has Been Filed', `
        <p>Hi ${recipientName},</p>
        <p><strong>${raisedByName}</strong> has opened a formal dispute on your lease. All escrow funds have been frozen pending resolution.</p>
        <div class="detail">
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Case Reference:</strong> CASE-${caseId.substring(0, 8).toUpperCase()}</p>
            <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please log into your dashboard to review the submitted evidence and take action.</p>
        <a class="btn" href="${APP_URL}/disputes">View Dispute Case →</a>
    `);
    await sendMail(recipientEmail, subject, html);
}

// ──────────────────────────────────────────────
//  Event: Escrow payment confirmed on-chain
// ──────────────────────────────────────────────
export async function notifyPaymentConfirmed({ tenantEmail, tenantName, landlordEmail, landlordName, propertyTitle, amount, txHash }) {
    const body = (name) => htmlWrapper('Escrow Payment Confirmed On-Chain ✅', `
        <p>Hi ${name},</p>
        <p>A smart contract payment has been confirmed on the Cardano blockchain.</p>
        <div class="detail">
            <p><strong>Property:</strong> ${propertyTitle}</p>
            <p><strong>Amount:</strong> RWF ${amount}</p>
            <p><strong>Tx Hash:</strong> <code style="font-size:11px">${txHash}</code></p>
        </div>
        <a class="btn" href="${APP_URL}/leases">View Escrow Dashboard →</a>
    `);
    const subject = `[EscrowChain] Payment Confirmed — ${propertyTitle}`;
    await sendMail(tenantEmail, subject, body(tenantName));
    await sendMail(landlordEmail, subject, body(landlordName));
}
