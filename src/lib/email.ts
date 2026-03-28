// src/lib/email.ts
// Email client wrapper — 已禁用（排查 node:fs 问题）

// Email configuration
export const EMAIL_CONFIG = {
  from: "笔记助手 <reminders@bijiassistant.shop>",
  replyTo: "support@bijiassistant.shop",
} as const;

// Email sending result
export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send email — 暂时禁用
 */
export async function sendEmail({
  to,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  console.log(`Email sending disabled. Would send to: ${to}`);
  return { success: false, error: "Email service is disabled during node:fs debugging" };
}

/**
 * Send batch emails — 暂时禁用
 */
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text: string;
  }>
): Promise<EmailResult[]> {
  console.log(`Batch email sending disabled. ${emails.length} emails would be sent.`);
  return emails.map((email) => ({
    success: false,
    error: "Email service is disabled during node:fs debugging",
  }));
}
