// src/app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { Loader2, Bell, Clock, Filter, User, Save, X } from "lucide-react";

const TIMEZONES = [
  { value: "Asia/Shanghai", label: "Beijing (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "America/New_York", label: "New York (UTC-5/UTC-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/UTC-7)" },
  { value: "Europe/London", label: "London (UTC+0/UTC+1)" },
  { value: "Europe/Paris", label: "Paris (UTC+1/UTC+2)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10/UTC+11)" },
];

interface Preferences {
  emailNotificationsEnabled: boolean;
  dailyReminderTime: string;
  reminderTimezone: string;
  includedDomains: string[];
  displayName: string | null;
  saveSearchHistory: boolean;
}

function NotificationDrawer({
  open,
  onClose,
  availableDomains = [],
}: {
  open: boolean;
  onClose: () => void;
  availableDomains?: string[];
}) {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) throw new Error("Failed to fetch");
      const json = await response.json();
      const data = json as Preferences;
      setPreferences(data);
    } catch {
      setPreferences({
        emailNotificationsEnabled: true,
        dailyReminderTime: "09:00",
        reminderTimezone: "Asia/Shanghai",
        includedDomains: [],
        displayName: null,
        saveSearchHistory: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) throw new Error("Failed to save");
      setSaveMessage("Settings saved");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Save failed");
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D5]">
          <h2 className="text-lg font-semibold text-[#1C1C1C]">Notification Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#FAF7F2] transition-colors"
          >
            <X width={20} height={20} className="text-[#6B5B4F]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#B8860B]" />
            </div>
          ) : preferences ? (
            <div className="space-y-6">
              {/* Save message */}
              {saveMessage && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
                  {saveMessage}
                </div>
              )}

              {/* Email Notifications */}
              <section className="rounded-xl border border-[#E8E0D5] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#B8860B]/10 flex items-center justify-center">
                    <Bell width={20} height={20} className="text-[#B8860B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1C1C1C]">Email Reminders</h3>
                    <p className="text-sm text-[#9C8E80]">Receive daily review reminders</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#FAF7F2] p-4">
                  <div>
                    <p className="font-medium text-[#1C1C1C]">Enable email notifications</p>
                    <p className="text-sm text-[#9C8E80]">Max one email per day when reviews are due</p>
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
                        ? "bg-[#B8860B]"
                        : "bg-[#D4C4B0]"
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

              {/* Reminder Time */}
              <section className="rounded-xl border border-[#E8E0D5] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#B8860B]/10 flex items-center justify-center">
                    <Clock width={20} height={20} className="text-[#B8860B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1C1C1C]">Reminder Time</h3>
                    <p className="text-sm text-[#9C8E80]">Set your daily reminder time</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#6B5B4F]">
                      Daily reminder time
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
                      className="rounded-lg border border-[#E8E0D5] px-4 py-2 text-[#1C1C1C] focus:border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#6B5B4F]">
                      Timezone
                    </label>
                    <select
                      value={preferences.reminderTimezone}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          reminderTimezone: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-[#E8E0D5] px-4 py-2 text-[#1C1C1C] focus:border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20"
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

              {/* Domain Filters */}
              <section className="rounded-xl border border-[#E8E0D5] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#B8860B]/10 flex items-center justify-center">
                    <Filter width={20} height={20} className="text-[#B8860B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1C1C1C]">Domain Filters</h3>
                    <p className="text-sm text-[#9C8E80]">Only receive reminders for selected domains</p>
                  </div>
                </div>

                {availableDomains.length === 0 ? (
                  <p className="text-[#9C8E80]">No domains created yet</p>
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
                              ? "bg-[#B8860B]/10 text-[#B8860B] ring-2 ring-[#B8860B]"
                              : "bg-[#FAF7F2] text-[#6B5B4F] hover:bg-[#E8E0D5]"
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
                    className="mt-3 text-sm text-[#9C8E80] hover:text-[#6B5B4F]"
                  >
                    Clear selection
                  </button>
                )}
              </section>

              {/* Profile */}
              <section className="rounded-xl border border-[#E8E0D5] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#B8860B]/10 flex items-center justify-center">
                    <User width={20} height={20} className="text-[#B8860B]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1C1C1C]">Display Name</h3>
                    <p className="text-sm text-[#9C8E80]">Name used in email greetings</p>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={preferences.displayName || ""}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        displayName: e.target.value || null,
                      })
                    }
                    placeholder="e.g., Alex"
                    maxLength={50}
                    className="w-full rounded-lg border border-[#E8E0D5] px-4 py-2 text-[#1C1C1C] placeholder-[#9C8E80] focus:border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20"
                  />
                  <p className="mt-1 text-sm text-[#9C8E80]">
                    Leave blank to use your email prefix
                  </p>
                </div>
              </section>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D5]">
          <button
            onClick={savePreferences}
            disabled={saving || !preferences}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white py-3 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E0D5]">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Settings</h1>
          <p className="mt-1 text-[#6B5B4F]">
            Manage your account preferences
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Account Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h2 className="text-lg font-semibold text-[#1C1C1C]">Account</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#B8860B]/10 flex items-center justify-center">
                <span className="text-2xl font-semibold text-[#B8860B]">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-[#1C1C1C]">{user?.email}</p>
                <p className="text-sm text-[#9C8E80]">Free Plan</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[#E8E0D5]">
                <div>
                  <p className="font-medium text-[#1C1C1C]">Email</p>
                  <p className="text-sm text-[#9C8E80]">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[#1C1C1C]">Member Since</p>
                  <p className="text-sm text-[#9C8E80]">March 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h2 className="text-lg font-semibold text-[#1C1C1C]">Preferences</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Notification Settings - opens drawer */}
              <button
                onClick={() => setNotificationsOpen(true)}
                className="w-full flex items-center justify-between py-3 hover:bg-[#FAF7F2] -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B8860B]/10 flex items-center justify-center">
                    <Bell width={20} height={20} className="text-[#B8860B]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#1C1C1C]">Notification Settings</p>
                    <p className="text-sm text-[#9C8E80]">Manage email reminders</p>
                  </div>
                </div>
                <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C8E80" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Billing */}
              <Link
                href="/settings/billing"
                className="w-full flex items-center justify-between py-3 hover:bg-[#FAF7F2] -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B8860B]/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#1C1C1C]">Billing & Subscription</p>
                    <p className="text-sm text-[#9C8E80]">Manage your plan and payments</p>
                  </div>
                </div>
                <svg className="shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9C8E80" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1C1C1C]">Delete Account</p>
                <p className="text-sm text-[#9C8E80]">Permanently delete your account and all data</p>
              </div>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Notification Drawer */}
      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
