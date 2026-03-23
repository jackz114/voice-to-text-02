// src/lib/fsrs.ts
// FSRS 算法辅助函数 — 数据库行与 ts-fsrs Card 对象之间的映射
import { Card, RecordLogItem } from "ts-fsrs";

// 数据库行类型（来自 review_state 表）
export interface ReviewStateRow {
  stability: number;
  difficulty: number;
  retrievability: number;
  reviewCount: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date;
}

// 将数据库行转换为 ts-fsrs Card 对象（仅用于非首次复习）
export function dbRowToFsrsCard(row: ReviewStateRow): Card {
  return {
    due: row.nextReviewAt,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: 0, // 由 f.next() 内部重新计算
    scheduled_days: 0,
    learning_steps: 0,
    reps: row.reviewCount,
    lapses: 0,
    state: row.reviewCount === 0 ? 0 : 2, // 0=New, 2=Review
    last_review: row.lastReviewedAt ?? undefined,
  };
}

// 将 ts-fsrs 结果转换为数据库更新对象
export function fsrsResultToDbUpdate(
  result: RecordLogItem,
  previousReviewCount: number
): {
  stability: number;
  difficulty: number;
  retrievability: number;
  reviewCount: number;
  lastReviewedAt: Date;
  nextReviewAt: Date;
} {
  return {
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    retrievability: 0, // 本阶段不计算 retrievability，保留 0
    reviewCount: previousReviewCount + 1,
    lastReviewedAt: new Date(),
    nextReviewAt: result.card.due,
  };
}
