// src/components/dashboard/ProgressCard.tsx
"use client";

interface ProgressCardProps {
  name: string;
  activated: number;
  total: number;
}

export function ProgressCard({ name, activated, total }: ProgressCardProps) {
  const percentage = total > 0 ? (activated / total) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-[#E8E0D5]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#1C1C1C]">{name}</span>
        <span className="text-sm text-[#6B5B4F]">
          {activated}/{total}
        </span>
      </div>
      <div className="h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#B8860B] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
