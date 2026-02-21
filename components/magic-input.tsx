'use client'

import { useState, useOptimistic, useTransition, useRef, useEffect } from 'react'
import { extractTransactionDetails, saveTransaction, transcribeAudio, extractFromImage, extractFromPdf } from '@/actions/transaction'
import { getCategories } from '@/actions/categories'
import { Transaction, AIAnswer, Category, SavingGoal } from '@/lib/types'
import { Sparkles, ArrowUp, Loader2, MessageSquare, Mic, Camera, StopCircle, X, Trash2, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'
import { useSettings } from '@/components/providers/settings-provider'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'

export function MagicInput({ onTransactionAdded, onRefresh, onGoalsChange }: { 
    onTransactionAdded?: (t: Transaction[]) => void, 
    onRefresh?: () => void,
    onGoalsChange?: (goals: SavingGoal[]) => void
}) {
    const { t } = useSettings()
    const [input, setInput] = useState('')
    const [lastRawText, setLastRawText] = useState('')
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const { isRecording, silenceWarning, toggleRecording } = useAudioRecorder({
        onTranscription: (text) => setInput(text),
        getMessage: (key) => t(key as any),
        transcribe: transcribeAudio,
    })

    const [showManualFallback, setShowManualFallback] = useState(false);
    const [manualDescription, setManualDescription] = useState('');
    const [manualAmount, setManualAmount] = useState('');
    const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualCategoryId, setManualCategoryId] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);

    const isQuestion = input.trim().startsWith('?');

    const handleToggleRecording = () => {
        startTransition(async () => {
            toggleRecording();
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf';
        toast.info(isPdf ? t('magicInput.analyzing_pdf') : t('magicInput.analyzing_image'));

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            try {
                const result = isPdf
                    ? await extractFromPdf(formData)
                    : await extractFromImage(formData);

                if (Array.isArray(result)) {
                    for (const t_ of result) {
                        await saveTransaction(t_);
                    }
                    if (onTransactionAdded) {
                        onTransactionAdded(result);
                    }

                    const warnings = result.filter(t => t.warning);
                    if (warnings.length > 0) {
                        toast.warning(`${t('magicInput.anomaly_detected')}: ${warnings[0].warning}`, { duration: 6000 });
                    }

                    toast.success(`${result.length} ${t('magicInput.expenses_saved')}`);
                } else if (!('type' in result)) {
                    const t_ = result as Transaction;
                    await saveTransaction(t_);
                    if (onTransactionAdded) {
                        onTransactionAdded([result as Transaction]);
                    }

                    if (t_.warning) {
                        toast.warning(`${t('magicInput.anomaly_detected')}: ${t_.warning}`, { duration: 6000 });
                    }
                    toast.success(t('magicInput.document_saved'));
                } else {
                    const aiAnswer = result as AIAnswer;
                    toast.info(aiAnswer.text);
                    if (aiAnswer.updatedGoals && onGoalsChange) {
                        onGoalsChange(aiAnswer.updatedGoals);
                    }
                    if (aiAnswer.refreshRequired && onRefresh) {
                        onRefresh();
                    }
                }
            } catch (error) {
                toast.error(isPdf ? t('magicInput.error_pdf') : t('magicInput.error_file'));
                console.error(error);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const rawText = input;
        setLastRawText(rawText);
        setInput(''); // Clear immediately

        startTransition(async () => {
            try {
                // Call simulated AI
                const result = await extractTransactionDetails(rawText);

                if (Array.isArray(result)) {
                    if (result.length === 0) {
                        toast.error(t('magicInput.processing_error'));
                        setInput(rawText);
                        setShowManualFallback(true);
                        return;
                    }

                    // It's a list of transactions
                    for (const t of result) {
                        await saveTransaction(t);
                    }
                    
                    if (onTransactionAdded) {
                        onTransactionAdded(result);
                    }

                    const warnings = result.filter(t => t.warning);
                    if (warnings.length > 0) {
                        toast.warning(`${t('magicInput.anomaly_detected')}: ${warnings[0].warning}`, { duration: 6000 });
                    }

                    toast.success(`${result.length} ${t('magicInput.expenses_registered')}`);
                } else if (!('type' in result)) {
                    // It's a single transaction (fallback)
                    const t_ = result as Transaction;
                    const saveResult = await saveTransaction(t_);

                    if (saveResult.success && onTransactionAdded) {
                        onTransactionAdded([result as Transaction]);
                    }

                    if (saveResult.success) {
                        toast.success(t('magicInput.expense_registered'));

                        // Check for unlocked achievements
                        // @ts-ignore
                        if (saveResult.unlockedAchievements && saveResult.unlockedAchievements.length > 0) {
                            // @ts-ignore
                            saveResult.unlockedAchievements.forEach((achievement: any) => {
                                toast.custom((id) => (
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-4 border border-white/20">
                                        <div className="p-2 bg-white/20 rounded-full">
                                            <Trophy className="w-6 h-6 animate-bounce" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm uppercase tracking-wider">{t('magicInput.achievement_unlocked')}</p>
                                            <p className="font-medium">{achievement.title}</p>
                                            <p className="text-xs text-white/80">+{achievement.xp_reward} XP</p>
                                        </div>
                                    </div>
                                ), { duration: 5000 });
                            });

                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 }
                            });
                        }
                    } else {
                        toast.error('Error al guardar: ' + saveResult.error);
                    }

                    if (t_.warning) {
                        toast.warning(`${t('magicInput.anomaly_detected')}: ${t_.warning}`, { duration: 6000 });
                    }
                } else {
                    const aiAnswer = result as AIAnswer;
                    toast.info(aiAnswer.text);
                }

            } catch (error) {
                toast.error(t('magicInput.processing_error'));
                setInput(rawText); // Restore on error
                setShowManualFallback(true);
            }
        });
    }

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Auto-resize del textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            if (input.trim() === '') {
                textareaRef.current.style.height = '60px'; // Altura base forzada
            } else {
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }
    }, [input]);

    // Reset confirm state on input change
    useEffect(() => {
        if (showClearConfirm) setShowClearConfirm(false);
    }, [input]);

    const handleClear = () => {
        if (showClearConfirm) {
            setInput('');
            setShowClearConfirm(false);
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        } else {
            setShowClearConfirm(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setIsLoadingCategories(true);
                const data = await getCategories();
                setCategories(data || []);
                if (data && data.length > 0 && !manualCategoryId) {
                    setManualCategoryId(data[0].id);
                }
            } finally {
                setIsLoadingCategories(false);
            }
        };

        if (showManualFallback && categories.length === 0 && !isLoadingCategories) {
            loadCategories();
        }
    }, [showManualFallback, categories.length, manualCategoryId, isLoadingCategories]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualDescription.trim() && !lastRawText.trim()) {
            toast.error(t('magicInput.processing_error'));
            return;
        }
        if (!manualAmount || isNaN(Number(manualAmount)) || Number(manualAmount) <= 0) {
            toast.error(t('magicInput.processing_error'));
            return;
        }
        if (!manualDate) {
            toast.error(t('magicInput.processing_error'));
            return;
        }
        if (!manualCategoryId && categories.length === 0) {
            toast.error('No hay categorías disponibles. Crea una desde la pantalla de categorías.');
            return;
        }

        const category = categories.find(c => c.id === manualCategoryId) || categories[0];
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            amount: Number(manualAmount),
            category_id: category.id,
            category,
            description: manualDescription.trim() || lastRawText.trim(),
            date: new Date(manualDate).toISOString(),
            emoji: category.emoji,
        };

        setIsSavingManual(true);
        try {
            const result = await saveTransaction(transaction);
            if (result.success) {
                if (onTransactionAdded) {
                    onTransactionAdded([transaction]);
                }
                toast.success(t('magicInput.expense_registered'));
                setShowManualFallback(false);
                setManualDescription('');
                setManualAmount('');
                setManualDate(new Date().toISOString().split('T')[0]);
            } else {
                toast.error('Error al guardar: ' + result.error);
            }
        } finally {
            setIsSavingManual(false);
        }
    };

    const hasContent = input.trim().length > 0;
    const showCamera = !hasContent && !isRecording;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="flex flex-col bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl transition-all duration-300 focus-within:ring-1 focus-within:ring-white/10 focus-within:border-white/20 overflow-hidden">

                    <div className="relative w-full">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isPending || isRecording}
                            placeholder={isRecording ? t('magicInput.listening') : (isQuestion ? t('magicInput.what_do_you_want_to_know') : t('magicInput.what_did_you_spend_on'))}
                            rows={1}
                            className={cn(
                                "w-full bg-transparent text-base md:text-lg leading-tight text-foreground placeholder:text-muted-foreground/50 outline-none resize-none min-h-[60px] max-h-[200px] overflow-y-auto transition-all duration-300",
                                hasContent ? "py-4 pl-4 pr-12" : "py-4 pl-4 pr-4"
                            )}
                            style={{ lineHeight: '1.25' }}
                        />

                        <div className={cn(
                            "absolute top-3 right-3 z-20 transition-all duration-300",
                            hasContent ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
                        )}>
                            <button
                                type="button"
                                onClick={handleClear}
                                className={cn(
                                    "p-1.5 rounded-full transition-all duration-200 flex items-center gap-1 shadow-sm backdrop-blur-md",
                                    showClearConfirm
                                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 pr-3 border border-red-500/20"
                                        : "bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 hover:text-white border border-white/5"
                                )}
                            >
                                {showClearConfirm ? (
                                    <>
                                        <Trash2 className="w-3 h-3" />
                                        <span className="text-xs font-medium">{t('magicInput.delete_confirm')}</span>
                                    </>
                                ) : (
                                    <X className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                    />

                    <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-1">
                            {isRecording ? (
                                <button
                                    type="button"
                                    onClick={handleToggleRecording}
                                    className="text-red-500 animate-pulse cursor-pointer p-2 hover:bg-white/5 rounded-full transition-colors relative"
                                >
                                    <StopCircle className="w-6 h-6" />
                                    {silenceWarning !== null && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-bounce">
                                            {silenceWarning}
                                        </span>
                                    )}
                                </button>
                            ) : (
                                <div className={cn(
                                    "flex items-center transition-all duration-300",
                                    hasContent ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                                )}>
                                    <button
                                        type="button"
                                        onClick={handleToggleRecording}
                                        className="text-zinc-400 hover:text-indigo-400 transition-all duration-300 cursor-pointer p-2 hover:bg-white/5 rounded-full"
                                    >
                                        <Mic className="w-6 h-6" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer p-2 hover:bg-white/5 rounded-full whitespace-nowrap"
                                    >
                                        <Camera className="w-6 h-6" />
                                    </button>
                                    <div className="h-6 w-[1px] bg-white/10 mx-1" />
                                </div>
                            )}

                            <div className="p-2">
                                {isQuestion ? (
                                    <MessageSquare className={cn("w-5 h-5 text-indigo-500 transition-all", isPending ? "animate-bounce" : "")} />
                                ) : (
                                    <Sparkles className={cn("w-5 h-5 text-indigo-500 transition-all", isPending ? "animate-pulse" : "")} />
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={!input.trim() || isPending || isRecording}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center",
                                    (input.trim() && !isRecording)
                                        ? "bg-white text-black shadow-lg hover:scale-105 active:scale-95"
                                        : "bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
                                )}
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {showManualFallback && (
                <form onSubmit={handleManualSubmit} className="space-y-4 p-4 rounded-2xl border border-amber-500/40 bg-amber-500/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-amber-500">
                                {t('magicInput.manual_fallback_title')}
                            </p>
                            <p className="text-xs text-amber-100/80">
                                {t('magicInput.manual_fallback_subtitle')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowManualFallback(false)}
                            className="p-2 rounded-full text-amber-200 hover:bg-amber-500/20 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-amber-100/80">
                                {t('magicInput.field_description')}
                            </label>
                            <input
                                type="text"
                                value={manualDescription}
                                onChange={(e) => setManualDescription(e.target.value)}
                                placeholder={lastRawText || ''}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-amber-500/40 text-sm text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-amber-100/80">
                                {t('magicInput.field_amount')}
                            </label>
                            <input
                                type="number"
                                value={manualAmount}
                                onChange={(e) => setManualAmount(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-amber-500/40 text-sm text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                                min={0}
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-amber-100/80">
                                {t('magicInput.field_date')}
                            </label>
                            <input
                                type="date"
                                value={manualDate}
                                onChange={(e) => setManualDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-amber-500/40 text-sm text-amber-50 placeholder:text-amber-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-amber-100/80">
                                {t('magicInput.field_category')}
                            </label>
                            <select
                                value={manualCategoryId}
                                onChange={(e) => setManualCategoryId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/20 border border-amber-500/40 text-sm text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                                disabled={isLoadingCategories || categories.length === 0}
                            >
                                {isLoadingCategories && (
                                    <option value="">{t('magicInput.processing')}</option>
                                )}
                                {!isLoadingCategories && categories.length === 0 && (
                                    <option value="">{t('magicInput.no_categories')}</option>
                                )}
                                {!isLoadingCategories && categories.length > 0 && categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowManualFallback(false)}
                            className="px-3 py-2 rounded-xl text-xs font-medium text-amber-100/80 hover:bg-amber-500/10 transition-colors"
                            disabled={isSavingManual}
                        >
                            {t('magicInput.cancel_manual')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingManual}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors disabled:opacity-60"
                        >
                            {isSavingManual ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {t('magicInput.save_manual')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
