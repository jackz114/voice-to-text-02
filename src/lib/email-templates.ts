// src/lib/email-templates.ts
// Email template rendering utilities

import { render } from "@react-email/components";
import { DailyReminderEmail } from "@/components/notifications/DailyReminderEmail";

interface DailyReminderData {
  username: string;
  count: number;
  domains: string[];
  dueDate: string;
  unsubscribeToken?: string;
}

/**
 * Generate username from email or display name (D-09)
 * Level 1: displayName if available
 * Level 2: email prefix formatted (alex_smith -> Alex Smith)
 * Level 3: fallback to "Learner"
 */
export function generateUsername(
  email: string,
  displayName?: string | null
): string {
  // Level 1: Use display name if available
  if (displayName?.trim()) {
    return displayName.trim();
  }

  // Level 2: Format email prefix
  const prefix = email.split("@")[0];
  if (prefix) {
    // Replace underscores and dots with spaces, then capitalize
    return prefix
      .replace(/[_\.]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Level 3: Fallback
  return "Learner";
}

/**
 * Format date for email display
 */
export function formatDueDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString("zh-CN", options);
}

/**
 * Render daily reminder email to HTML and plain text
 */
export async function renderDailyReminderEmail(
  data: DailyReminderData,
  baseUrl: string = "https://bijiassistant.shop"
): Promise<{ html: string; text: string }> {
  const unsubscribeUrl = data.unsubscribeToken
    ? `${baseUrl}/unsubscribe?token=${data.unsubscribeToken}`
    : `${baseUrl}/settings/notifications`;

  // Render React component to HTML
  const html = await render(
    DailyReminderEmail({
      username: data.username,
      count: data.count,
      domains: data.domains,
      dueDate: data.dueDate,
      unsubscribeUrl,
      settingsUrl: `${baseUrl}/settings/notifications`,
    })
  );

  // Generate plain text version
  const text = generatePlainText(data, unsubscribeUrl, baseUrl);

  return { html, text };
}

/**
 * Generate plain text version of daily reminder
 */
function generatePlainText(
  data: DailyReminderData,
  unsubscribeUrl: string,
  baseUrl: string
): string {
  const estimatedMinutes = Math.ceil(data.count * 0.5);

  return `
Hi ${data.username},

你有 ${data.count} 个知识点正在等待加固，花 ${estimatedMinutes} 分钟搞定它们吧！

${data.dueDate}

涉及领域：
${data.domains.map((d) => `- ${d}`).join("\n")}

立即开始复习：
${baseUrl}/review?session=daily&source=email

调整提醒设置：
${baseUrl}/settings/notifications

---
你收到这封邮件是因为你在笔记助手开启了每日复习提醒。

管理通知偏好：${baseUrl}/settings/notifications
退订邮件提醒：${unsubscribeUrl}

笔记助手 (bijiassistant.shop)
`.trim();
}
