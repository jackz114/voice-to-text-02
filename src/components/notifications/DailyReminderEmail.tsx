// src/components/notifications/DailyReminderEmail.tsx
// React Email template for daily reminders (D-06, D-07, D-08, D-09)

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface DailyReminderEmailProps {
  username: string;
  count: number;
  domains: string[];
  dueDate: string;
  unsubscribeUrl?: string;
  settingsUrl?: string;
}

export function DailyReminderEmail({
  username,
  count,
  domains,
  dueDate,
  unsubscribeUrl = "https://bijiassistant.shop/settings/notifications",
  settingsUrl = "https://bijiassistant.shop/settings/notifications",
}: DailyReminderEmailProps) {
  const previewText = `${username}，你有 ${count} 个知识点待复习`;
  const estimatedMinutes = Math.ceil(count * 0.5);

  // Determine urgency color based on count
  const getUrgencyColor = (count: number) => {
    if (count >= 10) return "text-red-600";
    if (count >= 5) return "text-amber-600";
    return "text-blue-600";
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] p-6">
            {/* Main content card */}
            <Section className="rounded-xl bg-white p-8 shadow-sm">
              {/* Greeting (D-09) */}
              <Heading className="mb-4 text-2xl font-bold text-gray-900">
                Hi {username},
              </Heading>

              {/* Main message */}
              <Text className="mb-6 text-lg text-gray-700">
                你有{" "}
                <strong className={getUrgencyColor(count)}>{count}</strong>{" "}
                个知识点正在等待加固，花 {estimatedMinutes} 分钟搞定它们吧！
              </Text>

              {/* Date context */}
              <Text className="mb-6 text-sm text-gray-500">{dueDate}</Text>

              {/* Domain badges (D-07) */}
              {domains.length > 0 && (
                <Section className="mb-8">
                  <Text className="mb-3 text-sm text-gray-600">
                    涉及领域：
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {domains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Primary CTA (D-08) */}
              <Button
                href={`https://bijiassistant.shop/review?session=daily&source=email`}
                className="mb-4 block w-full rounded-lg bg-blue-600 py-4 text-center text-base font-medium text-white"
              >
                🚀 立即开始复习
              </Button>

              {/* Secondary actions */}
              <Text className="text-center text-sm text-gray-500">
                <Link
                  href={settingsUrl}
                  className="text-blue-600 underline"
                >
                  调整提醒设置
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="mt-6 text-center">
              <Hr className="mb-6 border-gray-200" />

              <Text className="mb-4 text-xs text-gray-400">
                你收到这封邮件是因为你在笔记助手开启了每日复习提醒。
              </Text>

              <Text className="text-xs text-gray-400">
                <Link
                  href={settingsUrl}
                  className="text-gray-500 underline"
                >
                  管理通知偏好
                </Link>
                {" | "}
                <Link
                  href={unsubscribeUrl}
                  className="text-gray-500 underline"
                >
                  退订邮件提醒
                </Link>
              </Text>

              <Text className="mt-4 text-xs text-gray-400">
                笔记助手 (bijiassistant.shop)
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default DailyReminderEmail;
