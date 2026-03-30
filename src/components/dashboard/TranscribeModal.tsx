"use client";

import { useState, useRef } from "react";
import { useFolders, useKnowledge } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

interface TranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TranscribeModal({ isOpen, onClose }: TranscribeModalProps) {
  const { folders } = useFolders();
  const { refreshItems } = useKnowledge();
  const [transcribeMode, setTranscribeMode] = useState<"audio" | "text">("text");
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("default");
  const [frontContent, setFrontContent] = useState("");
  const [backContent, setBackContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "transcribing" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setTranscribeMode("text");
    setFrontContent("");
    setBackContent("");
    setTags([]);
    setTagInput("");
    setSelectedFolder("default");
    setUploadProgress("idle");
    setErrorMessage("");
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/x-m4a"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Invalid audio format. Please use WAV, MP3, M4A, or WebM.");
      setUploadProgress("error");
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage("File too large. Maximum size is 50MB.");
      setUploadProgress("error");
      return;
    }

    setUploading(true);
    setUploadProgress("uploading");
    setErrorMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Step 1: Upload audio to R2 via our API
      const formData = new FormData();
      formData.append("audio", file);

      const uploadResponse = await fetch("/api/audio/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadData = (await uploadResponse.json()) as { key?: string };
      const audioPath = uploadData.key;
      console.log("Audio uploaded:", audioPath);

      // Step 2: Transcribe the audio
      setUploading(false);
      setTranscribing(true);
      setUploadProgress("transcribing");

      const transcribeResponse = await fetch("/api/audio/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ audioPath }),
      });

      if (!transcribeResponse.ok) {
        const errorData = (await transcribeResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Transcription failed");
      }

      const transcribeData = (await transcribeResponse.json()) as { text?: string };

      // Step 3: Fill in the back content with transcribed text
      setBackContent(transcribeData.text || "");
      setUploadProgress("done");
      setTranscribing(false);

      // Auto-switch to text mode to show the result
      setTranscribeMode("text");
    } catch (error) {
      console.error("Transcription error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Transcription failed");
      setUploadProgress("error");
      setUploading(false);
      setTranscribing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleCreateNote = async () => {
    if (!frontContent.trim() || !backContent.trim()) return;

    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch("/api/library/item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: frontContent.trim(),
          content: backContent.trim(),
          tags,
          folder_id: selectedFolder === "default" ? null : selectedFolder,
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { details?: string; error?: string };
        throw new Error(error.details || error.error || "Creation failed");
      }

      const newItem = (await response.json()) as { id?: string };
      console.log("Note created:", newItem);
      await refreshItems();
      handleClose();
    } catch (error) {
      console.error("Failed to create note:", error);
      alert(error instanceof Error ? error.message : "Creation failed");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C1C1C] px-6 py-4">
          <h2 className="text-white font-semibold text-lg">Transcribe</h2>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 p-1 bg-[#FAF7F2] rounded-full w-fit">
            <button
              type="button"
              onClick={() => setTranscribeMode("text")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                transcribeMode === "text"
                  ? "bg-white text-[#1C1C1C] shadow-sm"
                  : "text-[#6B5B4F] hover:text-[#1C1C1C]"
              }`}
            >
              Text Input
            </button>
            <button
              type="button"
              onClick={() => setTranscribeMode("audio")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                transcribeMode === "audio"
                  ? "bg-white text-[#1C1C1C] shadow-sm"
                  : "text-[#6B5B4F] hover:text-[#1C1C1C]"
              }`}
            >
              Audio Upload
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {transcribeMode === "text" ? (
            <div className="space-y-4">
              {/* Folder Select */}
              <div>
                <label className="block text-xs font-medium text-[#6B5B4F] mb-1.5">Folder</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="default">default</option>
                  {folders.filter((f) => f.id !== "default").map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Front */}
              <div>
                <label className="block text-xs font-medium text-[#6B5B4F] mb-1.5">Front (Question)</label>
                <textarea
                  value={frontContent}
                  onChange={(e) => setFrontContent(e.target.value)}
                  placeholder="Enter the question..."
                  className="w-full h-20 px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent resize-none"
                />
              </div>

              {/* Back */}
              <div>
                <label className="block text-xs font-medium text-[#6B5B4F] mb-1.5">Back (Answer)</label>
                <textarea
                  value={backContent}
                  onChange={(e) => setBackContent(e.target.value)}
                  placeholder="Enter the answer..."
                  className="w-full h-20 px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-[#6B5B4F] mb-1.5">Tags</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-[#1C1C1C] text-sm placeholder-[#9C8E80] focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:border-transparent"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `hsl(${tag.charCodeAt(0) * 10 % 360}, 60%, 90%)`,
                          color: `hsl(${tag.charCodeAt(0) * 10 % 360}, 60%, 40%)`,
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:opacity-70 transition-opacity"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className={[
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragOver
                  ? "border-[#B8860B] bg-[#B8860B]/5"
                  : "border-[#D4C4B0] hover:border-[#B8860B]/50",
              ].join(" ")}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <svg
                className="mx-auto mb-3 text-[#9C8E80]"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
              </svg>

              {uploadProgress === "idle" && (
                <>
                  <p className="text-sm text-[#6B5B4F] mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-[#9C8E80] mb-4">
                    WAV, MP3, M4A up to 50MB
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors"
                  >
                    Upload
                  </button>
                </>
              )}

              {uploadProgress === "uploading" && (
                <>
                  <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#6B5B4F] mb-1">Uploading audio...</p>
                </>
              )}

              {uploadProgress === "transcribing" && (
                <>
                  <div className="w-8 h-8 mx-auto mb-3 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#6B5B4F] mb-1">Transcribing audio...</p>
                  <p className="text-xs text-[#9C8E80]">This may take a moment</p>
                </>
              )}

              {uploadProgress === "done" && (
                <>
                  <div className="w-8 h-8 mx-auto mb-3 text-green-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6B5B4F] mb-1">Transcription complete!</p>
                  <p className="text-xs text-[#9C8E80] mb-4">Review and edit the result below</p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadProgress("idle");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors"
                  >
                    Transcribe Another
                  </button>
                </>
              )}

              {uploadProgress === "error" && (
                <>
                  <div className="w-8 h-8 mx-auto mb-3 text-red-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-600 mb-1">{errorMessage || "An error occurred"}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadProgress("idle");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D5] flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#6B5B4F] text-sm font-medium transition-colors border border-[#E8E0D5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateNote}
            disabled={creating || (transcribeMode === "text" && (!frontContent.trim() || !backContent.trim()))}
            className="px-5 py-2 rounded-full bg-[#B8860B] hover:bg-[#8B6914] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
