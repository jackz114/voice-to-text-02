"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ReviewSession } from "@/components/dashboard/ReviewSession";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder") ?? undefined;

  return (
    <DashboardLayout>
      <ReviewSession
        folderId={folderId}
        onComplete={() => {
          // Do something after review is complete
        }}
        onExit={() => router.push("/dashboard")}
      />
    </DashboardLayout>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" /></div>}>
      <ReviewContent />
    </Suspense>
  );
}