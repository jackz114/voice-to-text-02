"use client";

import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { supabase } from "@/components/auth/AuthProvider";

interface DomainFilterProps {
  selectedDomain: string | null;
  onDomainChange: (domain: string | null) => void;
}

export function DomainFilter({
  selectedDomain,
  onDomainChange,
}: DomainFilterProps) {
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch user's domains from the library API
    const fetchDomains = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const response = await fetch("/api/library/domains", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch domains");
        }

        const data = await response.json();
        setDomains(data.domains || []);
      } catch (error) {
        console.error("Error fetching domains:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  if (loading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-100" />
    );
  }

  if (domains.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300"
      >
        {selectedDomain ? (
          <>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {selectedDomain}
            </span>
            <X
              className="h-4 w-4 text-gray-400 hover:text-gray-600"
              onClick={(e: React.MouseEvent<SVGSVGElement>) => {
                e.stopPropagation();
                onDomainChange(null);
              }}
            />
          </>
        ) : (
          <>
            <span>所有领域</span>
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => {
                onDomainChange(null);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                !selectedDomain ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`}
            >
              所有领域
            </button>
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => {
                  onDomainChange(domain);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  selectedDomain === domain
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
