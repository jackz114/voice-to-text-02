"use client";

import { useState } from "react";

interface RenameModalProps {
  open: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export function RenameModal({ open, currentName, onClose, onRename }: RenameModalProps) {
  const [name, setName] = useState(currentName);

  if (!open) return null;

  const handleRename = () => {
    if (name.trim() && name.trim() !== currentName) {
      onRename(name.trim());
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C1C1C] px-6 py-4">
          <h2 className="text-white font-semibold text-lg">Rename folder</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent transition-all"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRename();
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D5] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#6B5B4F] text-sm font-medium transition-colors border border-[#E8E0D5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRename}
            disabled={!name.trim() || name.trim() === currentName}
            className="px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
