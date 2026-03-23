"use client";

import { useState } from "react";

interface KnowledgeItemCandidate {
  title: string;
  content: string;
  source?: string;
  domain: string;
  tags: string[];
}

interface CardItem extends KnowledgeItemCandidate {
  id: string; // local ID for keying
  status: "default" | "accepted" | "rejected" | "editing";
  // editing state fields (copies of original, overwritten on save)
  editTitle: string;
  editContent: string;
  editSource: string;
  editDomain: string;
  editTags: string[];
  // reject confirmation UX
  pendingReject: boolean;
}

interface ConfirmationCardsProps {
  items: KnowledgeItemCandidate[];
  onConfirm: (acceptedItems: KnowledgeItemCandidate[]) => Promise<void>;
  isSaving: boolean;
}

export function ConfirmationCards({ items, onConfirm, isSaving }: ConfirmationCardsProps) {
  const [cards, setCards] = useState<CardItem[]>(() =>
    items.map((item, i) => ({
      ...item,
      id: `card-${i}`,
      status: "default",
      editTitle: item.title,
      editContent: item.content,
      editSource: item.source ?? "",
      editDomain: item.domain,
      editTags: [...item.tags],
      pendingReject: false,
    }))
  );
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const acceptedCards = cards.filter((c) => c.status === "accepted");
  const selectableCards = cards.filter((c) => c.status !== "rejected");
  const allSelected = selectableCards.length > 0 && selectableCards.every((c) => c.status === "accepted");
  const canConfirm = acceptedCards.length > 0 && !isSaving;

  // Accept a card
  const handleAccept = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "accepted", pendingReject: false } : c))
    );
  };

  // Initiate reject (show inline confirmation)
  const handleRejectRequest = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, pendingReject: true } : c)));
  };

  // Confirm reject
  const handleRejectConfirm = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "rejected", pendingReject: false } : c))
    );
  };

  // Cancel reject
  const handleRejectCancel = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, pendingReject: false } : c)));
  };

  // Undo reject
  const handleUndo = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "default" } : c)));
  };

  // Enter edit mode
  const handleEdit = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "editing" } : c)));
  };

  // Cancel edit — restore original field values
  const handleEditCancel = (id: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "default",
              editTitle: c.title,
              editContent: c.content,
              editSource: c.source ?? "",
              editDomain: c.domain,
              editTags: [...c.tags],
            }
          : c
      )
    );
  };

  // Save edit — update canonical fields from edit fields
  const handleEditSave = (id: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "default",
              title: c.editTitle,
              content: c.editContent,
              source: c.editSource || undefined,
              domain: c.editDomain,
              tags: c.editTags,
            }
          : c
      )
    );
  };

  // 全选/全取消切换
  const handleToggleAll = () => {
    if (allSelected) {
      setCards((prev) =>
        prev.map((c) => (c.status === "accepted" ? { ...c, status: "default" } : c))
      );
    } else {
      setCards((prev) =>
        prev.map((c) => (c.status !== "rejected" ? { ...c, status: "accepted" } : c))
      );
    }
  };

  // Tag input: commit on Enter, comma, or Tab
  const handleTagKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = tagInputs[id] ?? "";
    if (["Enter", ",", "Tab"].includes(e.key) && input.trim()) {
      e.preventDefault();
      setCards((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          if (c.editTags.length >= 10) return c; // max 10 tags
          const newTag = input.trim().replace(/,$/, "");
          if (!newTag || c.editTags.includes(newTag)) return c;
          return { ...c, editTags: [...c.editTags, newTag] };
        })
      );
      setTagInputs((prev) => ({ ...prev, [id]: "" }));
    } else if (e.key === "Backspace" && input === "") {
      // Delete last tag on Backspace when input empty
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, editTags: c.editTags.slice(0, -1) } : c))
      );
    }
  };

  const handleTagRemove = (id: string, tag: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, editTags: c.editTags.filter((t) => t !== tag) } : c
      )
    );
  };

  // Build accepted items for confirmation, using current (possibly edited) canonical fields
  const handleConfirm = async () => {
    const accepted = acceptedCards.map(({ title, content, source, domain, tags }) => ({
      title,
      content,
      source,
      domain,
      tags,
    }));
    await onConfirm(accepted);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Card list */}
      {cards.map((card) => (
        <div
          key={card.id}
          className={[
            "rounded-xl border bg-gray-50 dark:bg-gray-900 p-6 transition-all",
            card.status === "accepted"
              ? "border-blue-500 dark:border-blue-400 shadow-sm ring-1 ring-blue-500 dark:ring-blue-400"
              : "border-gray-200 dark:border-gray-700",
            card.status === "rejected" ? "opacity-40" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {card.status === "editing" ? (
            /* Edit mode — inline editable fields */
            <div className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">标题</label>
                <input
                  type="text"
                  value={card.editTitle}
                  onChange={(e) =>
                    setCards((prev) =>
                      prev.map((c) =>
                        c.id === card.id ? { ...c, editTitle: e.target.value } : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-base text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              {/* Content */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">内容摘要</label>
                <textarea
                  value={card.editContent}
                  rows={3}
                  onChange={(e) =>
                    setCards((prev) =>
                      prev.map((c) =>
                        c.id === card.id ? { ...c, editContent: e.target.value } : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-base text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">建议 100-200 字符，适合间隔重复复习</p>
              </div>
              {/* Domain */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">领域</label>
                <input
                  type="text"
                  value={card.editDomain}
                  onChange={(e) =>
                    setCards((prev) =>
                      prev.map((c) =>
                        c.id === card.id ? { ...c, editDomain: e.target.value } : c
                      )
                    )
                  }
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  标签
                  {card.editTags.length >= 10 && (
                    <span className="ml-2 text-amber-600">已达 10 个上限</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[40px]">
                  {card.editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(card.id, tag)}
                        className="text-gray-400 hover:text-red-600 text-xs leading-none"
                        aria-label={`删除标签 ${tag}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {card.editTags.length < 10 && (
                    <input
                      type="text"
                      value={tagInputs[card.id] ?? ""}
                      onChange={(e) =>
                        setTagInputs((prev) => ({ ...prev, [card.id]: e.target.value }))
                      }
                      onKeyDown={(e) => handleTagKeyDown(card.id, e)}
                      placeholder="输入标签，按 Enter 确认"
                      className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400"
                    />
                  )}
                </div>
              </div>
              {/* Edit actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleEditCancel(card.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSave(card.id)}
                  className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  保存修改
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <>
              {/* Card header */}
              <div className="flex items-start gap-3 mb-3">
                {/* 勾选框 — 点击切换保留/取消保留 */}
                {card.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() =>
                      card.status === "accepted"
                        ? handleUndo(card.id)
                        : handleAccept(card.id)
                    }
                    className={[
                      "mt-1 shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                      card.status === "accepted"
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-400 dark:border-gray-500 hover:border-blue-500",
                    ].join(" ")}
                    aria-label={card.status === "accepted" ? "取消保留" : "保留此卡片"}
                  >
                    {card.status === "accepted" && (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                )}
                <div className="flex-1 flex items-start justify-between gap-4">
                  <h3
                    className={[
                      "text-xl font-semibold text-gray-900 dark:text-white leading-snug",
                      card.status === "rejected" ? "line-through" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {card.title}
                  </h3>
                  {card.status !== "rejected" && (
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(card.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        丢弃
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(card.id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        编辑
                      </button>
                    </div>
                  )}
                  {card.status === "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleUndo(card.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      撤销
                    </button>
                  )}
                </div>
              </div>

              {/* Reject inline confirmation */}
              {card.pendingReject && (
                <div className="mb-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>丢弃后该知识点不会保存。确认丢弃？</span>
                  <button
                    type="button"
                    onClick={() => handleRejectConfirm(card.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    是
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectCancel(card.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* Content */}
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {card.content}
              </p>

              {/* Meta row: domain badge, tags, source */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 text-xs">
                  {card.domain}
                </span>
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {card.source && (
                  <a
                    href={card.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 underline truncate max-w-[200px]"
                  >
                    {card.source}
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Bulk actions + confirm row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleToggleAll}
          disabled={isSaving}
          className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-40"
        >
          {allSelected ? "全部取消" : "全部保留"}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          title={!canConfirm && !isSaving ? "请至少保留一条知识点" : undefined}
          className="h-12 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              保存中…
            </>
          ) : (
            `确认并保存（${acceptedCards.length}）`
          )}
        </button>
      </div>
    </div>
  );
}
