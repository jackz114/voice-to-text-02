// src/app/api/capture/capture-client.ts
// AI 提取客户端 — OpenAI 单例、Zod schema、文本分块工具

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod/v3"; // 必须使用 zod/v3 路径，不能用 'zod' — 见研究报告 Pitfall 1

// OpenAI 单例
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Zod schema — 单个知识条目（返回给前端的候选项）
export const KnowledgeItemCandidateSchema = z.object({
  title: z.string(),
  content: z.string().max(200), // 100-200 字符，适合 FSRS 复习 (D-14)
  source: z.string().optional(), // 可选——让模型只在文本中明确存在时才填写
  domain: z.string(), // 领域标签 (EXTRACT-04)
  tags: z.array(z.string()), // 多个标签 (D-16)
});

// Zod schema — 完整提取结果（包含多个条目）
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

// 文本分块 — 在段落边界切分长文本 (D-08, Pattern 4)
// 每块约 3000 字符（约 750 tokens），在此范围内 GPT-4o-mini 提取质量稳定
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

// 从单块文本中提取知识条目
async function extractFromChunk(
  chunk: string,
  sourceUrl?: string
): Promise<KnowledgeItemCandidate[]> {
  const sourceHint = sourceUrl ? `\n来源网址: ${sourceUrl}` : "";
  const result = await openai.chat.completions.parse({
    model: "gpt-4o-mini",
    temperature: 0, // temperature: 0 是防止幻觉的必要设置 (PITFALLS.md)
    messages: [
      {
        role: "system",
        content: `从用户提供的文本中提取独立的知识条目。
规则：
- 只提取文本中明确陈述的事实，不要推断、扩展或添加原文没有的上下文
- 每个 content 摘要控制在 100-200 字符，适合间隔重复复习
- source 字段只在原文中明确存在网址或文章标题时填写，否则留空
- domain 填写最合适的学习领域（如 React、营销、经济学）
- tags 填写 2-5 个相关关键词标签`,
      },
      {
        role: "user",
        content: `${chunk}${sourceHint}`,
      },
    ],
    response_format: zodResponseFormat(ExtractionResultSchema, "extraction_result"),
  });

  if (result.choices[0].message.refusal) {
    throw new CaptureError("模型拒绝提取", "MODEL_REFUSED", 422);
  }

  return result.choices[0].message.parsed?.items ?? [];
}

// 主提取函数 — 处理分块和去重
export async function extractKnowledgeItems(
  text: string,
  sourceUrl?: string
): Promise<KnowledgeItemCandidate[]> {
  const chunks = chunkText(text);
  const allItems: KnowledgeItemCandidate[] = [];

  for (const chunk of chunks) {
    const items = await extractFromChunk(chunk, sourceUrl);
    allItems.push(...items);
  }

  // 简单去重：移除标题完全相同的条目（取首次出现）
  const seen = new Set<string>();
  return allItems.filter((item) => {
    const key = item.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { openai };
