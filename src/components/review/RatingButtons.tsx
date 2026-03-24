"use client";

interface RatingButtonsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}

const RATINGS = [
  {
    value: 1 as const,
    emoji: "😵",
    label: "完全忘记",
    sublabel: "Again",
    color:
      "bg-red-100 hover:bg-red-200 text-red-800 border-red-200",
  },
  {
    value: 2 as const,
    emoji: "😐",
    label: "模糊记得",
    sublabel: "Hard",
    color:
      "bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-200",
  },
  {
    value: 3 as const,
    emoji: "🙂",
    label: "准确回忆",
    sublabel: "Good",
    color:
      "bg-green-100 hover:bg-green-200 text-green-800 border-green-200",
  },
  {
    value: 4 as const,
    emoji: "🚀",
    label: "秒答且轻松",
    sublabel: "Easy",
    color:
      "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200",
  },
];

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="flex gap-2 w-full">
      {RATINGS.map((r) => (
        <button
          key={r.value}
          onClick={() => !disabled && onRate(r.value)}
          disabled={disabled}
          className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg border text-center transition-colors ${r.color} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="text-2xl">{r.emoji}</span>
          <span className="text-xs font-medium mt-1">{r.label}</span>
          <span className="text-xs text-gray-500">{r.sublabel}</span>
        </button>
      ))}
    </div>
  );
}
