import type { TransactionType } from "@/hooks/use-budget";

export interface AIConfidence {
  type: number;
  amount: number;
  label: number;
  category: number;
  date: number;
}

export interface AITransactionResult {
  type: TransactionType;
  amount: number;
  label: string;
  category: string;
  date: string;
  confidence: AIConfidence;
  needsReview: boolean;
}

export interface AIReceiptResponse {
  ok: boolean;
  result?: AITransactionResult;
  error?: string;
}
