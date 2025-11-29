import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const passwordSendEmail = process.env.RESEND_PASSWORD_RESET_EMAIL;

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  return await resend.emails.send({
    from: `BIMA Shelter <${passwordSendEmail}>`,
    to: to,
    subject: subject,
    replyTo: replyTo ? replyTo : "contact@lightgatesolutions.com",
    html: html,
    text: text,
  });
}

export function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { email: string; name: string };
  url: string;
}) {
  return sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Bima Shelter Team</p>
      </div>
    `,
    text: `Hello ${user.name},\n\nYou requested to reset your password. Click this link to reset it: ${url}\n\nIf you didn't request this, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nBima Shelter`,
  });
}

export function sendInAppEmailNotification({
  recipient,
  sender,
  emailData,
  appUrl,
}: {
  recipient: { email: string; name: string };
  sender: { name: string; email: string };
  emailData: {
    id: number;
    subject: string;
    body: string;
    attachmentCount: number;
    emailType: "sent" | "reply" | "forward";
  };
  appUrl: string;
}) {
  // Truncate body for preview (max 200 characters)
  const bodyPreview =
    emailData.body.length > 200
      ? `${emailData.body.substring(0, 200)}...`
      : emailData.body;

  // Create deep link to email
  const emailLink = `${appUrl}/mail/inbox?id=${emailData.id}`;

  // Determine email type label
  const typeLabel =
    emailData.emailType === "reply"
      ? "replied to your message"
      : emailData.emailType === "forward"
        ? "forwarded you a message"
        : "sent you a message";

  return sendEmail({
    to: recipient.email,
    replyTo: sender.email,
    subject: `${sender.name} ${typeLabel}: ${emailData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #1f2937; margin: 0;">New Message from ${sender.name}</h2>
        </div>

        <div style="background-color: white; padding: 24px; border: 1px solid #e5e7eb;">
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">From:</p>
            <p style="margin: 0; color: #1f2937; font-weight: 600;">${sender.name}</p>
          </div>

          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Subject:</p>
            <p style="margin: 0; color: #1f2937; font-weight: 600;">${emailData.subject}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Message Preview:</p>
            <div style="background-color: #f9fafb; padding: 12px; border-radius: 4px; border-left: 3px solid #3b82f6;">
              <p style="margin: 0; color: #374151; white-space: pre-wrap;">${bodyPreview}</p>
            </div>
          </div>

          ${
            emailData.attachmentCount > 0
              ? `
          <div style="margin-bottom: 24px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              📎 ${emailData.attachmentCount} attachment${emailData.attachmentCount !== 1 ? "s" : ""}
            </p>
          </div>
          `
              : ""
          }

          <a href="${emailLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Full Message
          </a>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification from BIMA Shelters. You received this because you have email notifications enabled.
          </p>
        </div>
      </div>
    `,
    text: `
${sender.name} ${typeLabel}

Subject: ${emailData.subject}

Message Preview:
${bodyPreview}

${emailData.attachmentCount > 0 ? `Attachments: ${emailData.attachmentCount}\n` : ""}
View full message: ${emailLink}

---
This is an automated notification from BIMA Shelters.
To manage your notification preferences, log in to your account.
    `.trim(),
  });
}
