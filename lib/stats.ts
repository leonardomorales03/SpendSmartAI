import { Transaction } from "./types";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";

export function calculateStats(transactions: Transaction[]) {
    const now = new Date();
    const currentMonthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonthInterval = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

    const currentMonthTransactions = transactions.filter(t =>
        isWithinInterval(new Date(t.date), currentMonthInterval)
    );

    const lastMonthTransactions = transactions.filter(t =>
        isWithinInterval(new Date(t.date), lastMonthInterval)
    );

    const totalMonth = currentMonthTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalLastMonth = lastMonthTransactions.reduce((acc, t) => acc + t.amount, 0);

    // 1. Percentage vs last month
    let diffPercent = 0;
    if (totalLastMonth > 0) {
        diffPercent = ((totalMonth - totalLastMonth) / totalLastMonth) * 100;
    }

    // 2. Transacciones count
    const count = currentMonthTransactions.length;

    // 3. Categoria TOP
    const catMap: Record<string, { total: number, emoji: string, name: string }> = {};
    currentMonthTransactions.forEach(t => {
        const catName = t.category?.name || 'General';
        if (!catMap[catName]) catMap[catName] = { total: 0, emoji: t.emoji || '📦', name: catName };
        catMap[catName].total += t.amount;
    });

    const sortedCats = Object.values(catMap).sort((a, b) => b.total - a.total);
    const topCategory = sortedCats[0] || { name: 'N/A', emoji: '📦', total: 0 };
    const topCatPercent = totalMonth > 0 ? (topCategory.total / totalMonth) * 100 : 0;

    // 4. Promedio diario
    const daysInMonthSoFar = now.getDate();
    const dailyAvg = totalMonth / daysInMonthSoFar;

    // 5. Gastos por semana
    const weeksMap: Record<string, number> = { 'Semana 1': 0, 'Semana 2': 0, 'Semana 3': 0, 'Semana 4': 0 };
    currentMonthTransactions.forEach(t => {
        const day = new Date(t.date).getDate();
        if (day <= 7) weeksMap['Semana 1'] += t.amount;
        else if (day <= 14) weeksMap['Semana 2'] += t.amount;
        else if (day <= 21) weeksMap['Semana 3'] += t.amount;
        else weeksMap['Semana 4'] += t.amount;
    });

    const weeklyData = Object.entries(weeksMap).map(([name, total]) => ({ name, total }));

    // 6. Gastos por categoría
    const categoryData = sortedCats.map(c => ({
        name: c.name,
        value: c.total,
        emoji: c.emoji
    }));

    return {
        totalMonth,
        diffPercent,
        count,
        topCategory: {
            ...topCategory,
            percent: topCatPercent
        },
        dailyAvg,
        weeklyData,
        categoryData
    };
}
