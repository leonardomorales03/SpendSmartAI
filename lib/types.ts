export type Category = {
    id: string;
    name: string;
    emoji: string;
    user_id?: string | null;
};

export type TransactionItem = {
    id: string;
    transaction_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    category?: string;
};

export type Transaction = {
    id: string;
    amount: number;
    category_id: string;
    category?: Category; // For UI display
    description: string;
    date: string; // ISO string
    emoji?: string; // Derived from category or AI
    warning?: string; // Anomaly detection warning
    debt_id?: string; // Optional link to a debt
    items?: TransactionItem[];
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
    data?: {
        label: string;
        value: number;
    }[];
}

export type Subscription = {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    currency: string;
    billing_day: number;
    frequency: 'monthly' | 'yearly';
    category_id: string;
    is_active: boolean;
    last_payment_date?: string;
    logo_url?: string; // Brand logo
    created_at: string;
    category?: Category; // For UI display
};

export type SavingGoal = {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    category: string | null;
    created_at: string;
    updated_at: string;
};
