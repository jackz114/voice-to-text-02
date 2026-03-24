// src/hooks/useCommandMenu.ts
// Cmd+K keyboard shortcut handler (D-13)

"use client";

import { useState, useEffect, useCallback } from "react";

export interface UseCommandMenuReturn {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export function useCommandMenu(): UseCommandMenuReturn {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close (D-13)
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return { open, setOpen, toggle };
}
