"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReviewSession } from "@/components/dashboard/ReviewSession";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") ?? undefined;

  return (
    <DashboardLayout>
      <ReviewSession
        folderId={folderId}
        onComplete={() => {
          // 复习完成后可以做一些处理
        }}
        onExit={() => router.push("/dashboard")}
      />
    </DashboardLayout>
  );
}