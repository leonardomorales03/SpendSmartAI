'use client'

import { Transaction } from "@/lib/types"
import { calculateStats } from "@/lib/stats"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

export function SpendingVelocity({ transactions }: { transactions: Transaction[] }) {
    const stats = calculateStats(transactions);
    const data = stats.weeklyData;
    return (
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
            <div className="mb-4">
                <h3 className="font-semibold text-foreground">Velocidad de Gasto</h3>
                <p className="text-xs text-muted-foreground">Hoy vs Mes Pasado</p>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e1b4b',
                                borderRadius: '12px',
                                border: '1px solid #312e81',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#fff' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#4f46e5"
                            fill="url(#colorTotal)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex gap-4 text-xs font-medium text-muted-foreground justify-center">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span> Flujo semanal
                </div>
            </div>
        </div>
    )
}
