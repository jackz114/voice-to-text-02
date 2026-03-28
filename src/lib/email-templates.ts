// src/lib/email-templates.ts
// Email template rendering utilities - Cloudflare Workers compatible

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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate HTML email template
 */
function generateHtmlEmail(
  data: DailyReminderData,
  baseUrl: string
): string {
  const { username, count, domains, dueDate, unsubscribeToken } = data;
  const estimatedMinutes = Math.ceil(count * 0.5);
  const unsubscribeUrl = unsubscribeToken
    ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
    : `${baseUrl}/settings/notifications`;
  const settingsUrl = `${baseUrl}/settings/notifications`;
  const reviewUrl = `${baseUrl}/review?session=daily&source=email`;

  // Determine urgency color
  let countColor = "#2563eb"; // blue-600
  if (count >= 10) countColor = "#dc2626"; // red-600
  else if (count >= 5) countColor = "#d97706"; // amber-600

  // Generate domain badges HTML
  const domainBadges = domains
    .map(
      (domain) =>
        `<span style="display:inline-block;background:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:9999px;font-size:12px;margin:4px 4px 4px 0;">${escapeHtml(domain)}</span>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>今日复习提醒</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Main content -->
          <tr>
            <td style="padding:32px;">
              <!-- Greeting -->
              <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:700;color:#111827;">
                Hi ${escapeHtml(username)},
              </h1>

              <!-- Main message -->
              <p style="margin:0 0 24px 0;font-size:18px;line-height:1.6;color:#374151;">
                你有 <strong style="color:${countColor};font-size:24px;">${count}</strong> 个知识点正在等待加固，花 ${estimatedMinutes} 分钟搞定它们吧！
              </p>

              <!-- Date -->
              <p style="margin:0 0 24px 0;font-size:14px;color:#6b7280;">
                ${escapeHtml(dueDate)}
              </p>

              <!-- Domains -->
              ${domains.length > 0 ? `
              <div style="margin-bottom:32px;">
                <p style="margin:0 0 12px 0;font-size:14px;color:#4b5563;">涉及领域：</p>
                <div>${domainBadges}</div>
              </div>
              ` : ""}

              <!-- CTA Button -->
              <table role="presentation" style="width:100%;margin-bottom:16px;">
                <tr>
                  <td>
                    <a href="${reviewUrl}" style="display:block;width:100%;padding:16px 0;background:#2563eb;color:#ffffff;text-align:center;text-decoration:none;border-radius:8px;font-size:16px;font-weight:500;">
                      立即开始复习
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Settings link -->
              <p style="margin:0;text-align:center;font-size:14px;">
                <a href="${settingsUrl}" style="color:#2563eb;text-decoration:underline;">调整提醒设置</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:12px;color:#9ca3af;">
                你收到这封邮件是因为你在笔记助手开启了每日复习提醒。
              </p>
              <p style="margin:0 0 8px 0;font-size:12px;color:#9ca3af;">
                <a href="${settingsUrl}" style="color:#6b7280;text-decoration:underline;">管理通知偏好</a>
                &nbsp;|&nbsp;
                <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">退订邮件提醒</a>
              </p>
              <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">
                笔记助手 (bijiassistant.shop)
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate plain text version of daily reminder
 */
function generatePlainText(
  data: DailyReminderData,
  baseUrl: string
): string {
  const { username, count, domains, dueDate, unsubscribeToken } = data;
  const estimatedMinutes = Math.ceil(count * 0.5);
  const unsubscribeUrl = unsubscribeToken
    ? `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
    : `${baseUrl}/settings/notifications`;

  return `
Hi ${username},

你有 ${count} 个知识点正在等待加固，花 ${estimatedMinutes} 分钟搞定它们吧！

${dueDate}

涉及领域：
${domains.map((d) => `- ${d}`).join("\n")}

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

/**
 * Render daily reminder email to HTML and plain text
 * Cloudflare Workers compatible - no React dependency
 */
export async function renderDailyReminderEmail(
  data: DailyReminderData,
  baseUrl: string = "https://bijiassistant.shop"
): Promise<{ html: string; text: string }> {
  const html = generateHtmlEmail(data, baseUrl);
  const text = generatePlainText(data, baseUrl);

  return { html, text };
}
