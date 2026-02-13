export type Category = {
    id: string;
    name: string;
    emoji: string;
    user_id?: string | null;
};

export type Transaction = {
    id: string;
    amount: number;
    category_id: string;
    category?: Category; // For UI display
    description: string;
    date: string; // ISO string
    emoji?: string; // Derived from category or AI
};

export type TransactionDraft = {
    amount: number;
    category_name: string; // AI might return name, we map to ID later
    emoji: string;
    description: string;
    date: string;
}

export type AIAnswer = {
    type: 'answer';
    text: string;
    chartType?: 'bar' | 'pie';
    data?: any[];
}
