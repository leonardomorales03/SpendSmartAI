'use client'

import { AIAnswer } from '@/lib/types'
import { motion } from 'framer-motion'
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

export function AIResult({ answer }: { answer: AIAnswer }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-6 shadow-sm"
        >
            <div className="flex gap-3">
                <div className="text-2xl">🤖</div>
                <div className="w-full">
                    <p className="text-indigo-900 font-medium mb-2">{answer.text}</p>

                    {answer.data && (
                        <div className="h-[150px] w-full mt-4 bg-white rounded-lg p-2 border border-indigo-100">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={answer.data}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
