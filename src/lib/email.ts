// src/lib/email.ts
// Resend client wrapper with error handling

import { Resend } from "resend";

// Resend 客户端懒加载（避免构建时因缺少环境变量而报错）
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

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
 * Send email with HTML and plain text versions
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  try {
    // Validate environment
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email service not configured" };
    }

    // Send email via Resend
    const { data, error } = await getResendClient().emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    console.log(`Email sent successfully to ${to}, id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Send batch emails (Resend supports up to 100 recipients per batch)
 */
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text: string;
  }>
): Promise<EmailResult[]> {
  // Process in batches of 100
  const batchSize = 100;
  const results: EmailResult[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchPromises = batch.map((email) => sendEmail(email));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
