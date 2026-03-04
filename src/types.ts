export interface Expense {
    id: number;
    user_id: number;
    amount: number;
    currency: string;
    category: string | null;
    description: string | null;
    created_at: string;
}

export interface ExpenseSummary {
    category: string | null;
    total: number;
    count: number;
}

export interface SummaryResult {
    byCategory: ExpenseSummary[];
    grandTotal: number;
    totalCount: number;
}
