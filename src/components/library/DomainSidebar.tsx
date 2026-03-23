"use client";

interface DomainSidebarProps {
  domains: string[];
  selectedDomain: string | null; // null = All
  onSelect: (domain: string | null) => void;
  itemCounts: Record<string, number>; // domain -> count mapping
}

export function DomainSidebar({ domains, selectedDomain, onSelect, itemCounts }: DomainSidebarProps) {
  const totalCount = Object.values(itemCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">领域</h2>
      <div className="space-y-1">
        {/* 全部 (All) option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={[
            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
            selectedDomain === null
              ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
              : "hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
          ].join(" ")}
        >
          <span>全部</span>
          <span className="ml-2 text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        </button>

        {/* Domain list */}
        {domains.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => onSelect(domain)}
            className={[
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
              selectedDomain === domain
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                : "hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
            ].join(" ")}
          >
            <span className="truncate text-left">{domain}</span>
            <span className="ml-2 shrink-0 text-xs bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {itemCounts[domain] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
