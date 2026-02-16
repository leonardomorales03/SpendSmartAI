'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import { processFinancialQuery } from '@/actions/chat'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Message = {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    error?: boolean
}

export function FinancialChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hola! Soy tu asistente financiero personal. Pregúntame sobre tus gastos, presupuesto o tendencias (ej: "¿Cuánto gasté en comida el mes pasado?").',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [lastQuery, setLastQuery] = useState<string | null>(null)
    const [lastUserMessageId, setLastUserMessageId] = useState<string | null>(null)
    const [lastErrorId, setLastErrorId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const runQuery = async (query: string, userMessageId: string) => {
        setIsLoading(true)
        setLastQuery(query)
        setLastUserMessageId(userMessageId)
        setLastErrorId(null)

        try {
            const response = await processFinancialQuery(query)

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.text,
                timestamp: new Date()
            }
            
            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            console.error(error)
            const errorId = `error-${Date.now()}`
            setLastErrorId(errorId)
            setMessages(prev => [
                ...prev,
                {
                    id: errorId,
                    role: 'system',
                    error: true,
                    content: 'Hubo un problema al procesar tu consulta. Revisa tu conexión e intenta de nuevo.',
                    timestamp: new Date()
                }
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        const query = input
        setInput('')

        await runQuery(query, userMessage.id)
    }

    const handleRetry = async () => {
        if (!lastQuery || !lastUserMessageId || isLoading) return
        setMessages(prev => prev.filter(m => m.id !== lastErrorId))
        await runQuery(lastQuery, lastUserMessageId)
    }

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="font-semibold text-foreground">Asistente Financiero</h2>
                    <p className="text-xs text-muted-foreground">Potenciado por Llama 3.3 & RAG</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <AnimatePresence initial={false}>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "flex w-full",
                                message.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={cn(
                                "flex max-w-[80%] gap-2",
                                message.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    message.role === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : message.error
                                            ? "bg-red-500/10 text-red-400"
                                            : "bg-muted text-muted-foreground"
                                )}>
                                    {message.role === 'user' ? (
                                        <User size={14} />
                                    ) : message.error ? (
                                        <AlertTriangle size={14} />
                                    ) : (
                                        <Bot size={14} />
                                    )}
                                </div>
                                
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    message.role === 'user' 
                                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                                        : message.error
                                            ? "bg-red-500/10 text-red-100 border border-red-500/40 rounded-tl-none"
                                            : "bg-muted text-foreground rounded-tl-none"
                                )}>
                                    <div className="whitespace-pre-line">
                                        {message.content}
                                    </div>
                                    {message.error && (
                                        <button
                                            type="button"
                                            onClick={handleRetry}
                                            disabled={isLoading}
                                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-red-200 hover:text-red-100 hover:underline disabled:opacity-60"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Reintentar con la misma pregunta
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="flex justify-start w-full"
                    >
                        <div className="flex max-w-[80%] gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot size={14} className="text-muted-foreground animate-pulse" />
                            </div>
                            <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta sobre tus gastos..."
                        className="flex-1 bg-muted/50 border-none focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/70"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1.5 p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    )
}
