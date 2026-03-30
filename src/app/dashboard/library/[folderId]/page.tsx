import { Suspense } from "react";
import { FolderContent } from "./FolderContent";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default async function FolderPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;

  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <FolderContent folderId={folderId} />
    </Suspense>
  );
}
