// src/components/notifications/NotificationPreferences.tsx
// Notification settings form (D-01, D-02)

"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Filter, User, Save, Loader2 } from "lucide-react";

interface PreferencesResponse {
  emailNotificationsEnabled: boolean;
  dailyReminderTime: string;
  reminderTimezone: string;
  includedDomains: string[];
  saveSearchHistory: boolean;
  displayName: string | null;
}

interface NotificationPreferencesProps {
  availableDomains?: string[];
}

const TIMEZONES = [
  { value: "Asia/Shanghai", label: "北京时间 (UTC+8)" },
  { value: "Asia/Tokyo", label: "东京时间 (UTC+9)" },
  { value: "Asia/Singapore", label: "新加坡时间 (UTC+8)" },
  { value: "America/New_York", label: "纽约时间 (UTC-5/UTC-4)" },
  { value: "America/Los_Angeles", label: "洛杉矶时间 (UTC-8/UTC-7)" },
  { value: "Europe/London", label: "伦敦时间 (UTC+0/UTC+1)" },
  { value: "Europe/Paris", label: "巴黎时间 (UTC+1/UTC+2)" },
  { value: "Australia/Sydney", label: "悉尼时间 (UTC+10/UTC+11)" },
];

export function NotificationPreferences({
  availableDomains = [],
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<PreferencesResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) throw new Error("Failed to fetch preferences");
      const data = await response.json();
      setPreferences(data);
    } catch (_err) {
      setError("加载设置失败");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      setSaveMessage("设置已保存");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (_err) {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const toggleDomain = (domain: string) => {
    if (!preferences) return;

    const current = preferences.includedDomains;
    const updated = current.includes(domain)
      ? current.filter((d) => d !== domain)
      : [...current, domain];

    setPreferences({ ...preferences, includedDomains: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        加载设置失败，请刷新页面重试
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Save status message */}
      {saveMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {saveMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Section 1: Email Notifications Toggle */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">邮件提醒</h3>
            <p className="text-sm text-gray-500">接收每日复习提醒邮件</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <p className="font-medium text-gray-900">启用邮件提醒</p>
            <p className="text-sm text-gray-500">
              每天最多一封邮件，仅当有复习内容时发送
            </p>
          </div>
          <button
            onClick={() =>
              setPreferences({
                ...preferences,
                emailNotificationsEnabled: !preferences.emailNotificationsEnabled,
              })
            }
            className={`relative h-7 w-12 rounded-full transition-colors ${
              preferences.emailNotificationsEnabled
                ? "bg-blue-600"
                : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                preferences.emailNotificationsEnabled
                  ? "left-6"
                  : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Section 2: Reminder Time (D-01) */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">提醒时间</h3>
            <p className="text-sm text-gray-500">选择你每天希望收到提醒的时间</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Time picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              每日提醒时间
            </label>
            <input
              type="time"
              value={preferences.dailyReminderTime}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  dailyReminderTime: e.target.value,
                })
              }
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Timezone selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              时区
            </label>
            <select
              value={preferences.reminderTimezone}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  reminderTimezone: e.target.value,
                })
              }
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section 3: Domain Filters (D-02) */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <Filter className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">领域筛选</h3>
            <p className="text-sm text-gray-500">
              只接收选中领域的提醒（不选则接收全部）
            </p>
          </div>
        </div>

        {availableDomains.length === 0 ? (
          <p className="text-gray-500">你还没有创建任何知识领域</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableDomains.map((domain) => {
              const isSelected = preferences.includedDomains.includes(domain);
              return (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-purple-100 text-purple-700 ring-2 ring-purple-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isSelected && "✓ "}
                  {domain}
                </button>
              );
            })}
          </div>
        )}

        {preferences.includedDomains.length > 0 && (
          <button
            onClick={() =>
              setPreferences({ ...preferences, includedDomains: [] })
            }
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            清除筛选
          </button>
        )}
      </section>

      {/* Section 4: Profile (D-09) */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2">
            <User className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">个人资料</h3>
            <p className="text-sm text-gray-500">设置显示名称用于邮件称呼</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            显示名称
          </label>
          <input
            type="text"
            value={preferences.displayName || ""}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                displayName: e.target.value || null,
              })
            }
            placeholder="例如：小明"
            maxLength={50}
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            邮件中将使用此名称称呼你，不填则使用邮箱前缀
          </p>
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              保存设置
            </>
          )}
        </button>
      </div>
    </div>
  );
}
