// src/app/api/capture/capture-client.ts
// AI 提取客户端 — 已禁用（排查 node:fs 问题）

import { z } from "zod/v3";

// Zod schema — 单个知识条目
export const KnowledgeItemCandidateSchema = z.object({
  title: z.string(),
  content: z.string().max(200),
  source: z.string().nullable(),
  domain: z.string(),
  tags: z.array(z.string()),
});

export const ExtractionResultSchema = z.object({
  items: z.array(KnowledgeItemCandidateSchema),
});

export type KnowledgeItemCandidate = z.infer<typeof KnowledgeItemCandidateSchema>;

// 错误类
export class CaptureError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "CaptureError";
  }
}

// 文本分块 — 保持兼容性
export function chunkText(text: string, maxChars = 3000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += "\n\n" + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// 主提取函数 — 暂时禁用 AI 提取
export async function extractKnowledgeItems(
  _text: string,
  _sourceUrl?: string
): Promise<KnowledgeItemCandidate[]> {
  // AI 提取功能已禁用，排查 node:fs 问题中
  console.log("AI extraction is disabled during node:fs debugging");
  return [];
}
