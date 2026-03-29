// src/app/api/capture/capture-client.ts
// AI 提取客户端 — DeepSeek API 调用

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

// 文本分块 — 在段落边界切分长文本
// 每块约 3000 字符，DeepSeek 上下文窗口足够在此范围内稳定提取
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
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new CaptureError("DEEPSEEK_API_KEY is not configured", "MISSING_API_KEY", 500);
  }

  const sourceHint = sourceUrl ? `\n来源网址: ${sourceUrl}` : "";

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0,
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
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!response.ok) {
    throw new CaptureError(
      `DeepSeek API error: ${response.status}`,
      "DEEPSEEK_ERROR",
      response.status
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; refusal?: string } }>;
  };

  const refusal = data.choices?.[0]?.message?.refusal;
  if (refusal) {
    throw new CaptureError("模型拒绝提取", "MODEL_REFUSED", 422);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as { items?: KnowledgeItemCandidate[] };
    return parsed.items ?? [];
  } catch {
    throw new CaptureError("AI 返回格式错误，无法解析", "PARSE_ERROR", 500);
  }
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
