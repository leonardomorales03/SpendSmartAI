'use client'

import { useState, useOptimistic, useTransition, useRef, useEffect } from 'react'
import { extractTransactionDetails, saveTransaction, transcribeAudio, extractFromImage, extractFromPdf } from '@/actions/transaction'
import { Transaction, AIAnswer } from '@/lib/types'
import { Sparkles, ArrowUp, Loader2, MessageSquare, Mic, Camera, StopCircle, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function MagicInput({ onTransactionAdded }: { onTransactionAdded?: (t: Transaction[]) => void }) {
    const [input, setInput] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Refs para detección de silencio (declarados antes de usarse)
    const silenceStartRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [silenceWarning, setSilenceWarning] = useState<number | null>(null);

    // Helper to check if it's an question
    const isQuestion = input.trim().startsWith('?');

    const getSupportedMimeType = () => {
        const types = [
            'audio/mp4',
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav',
            'audio/aac'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return ''; // Let browser decide default
    };

    const stopRecording = (autoStopped = false) => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            
            if (autoStopped) {
                toast.info('Grabación detenida por silencio 🤫');
            }
        }
    };

    const detectSilence = (analyser: AnalyserNode, dataArray: Uint8Array) => {
        analyser.getByteFrequencyData(dataArray as any);
        
        // Calcular volumen promedio
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Umbral de silencio (ajustable)
        const SILENCE_THRESHOLD = 10; 
        const MAX_SILENCE_DURATION = 5000; // 5 segundos
        const WARNING_THRESHOLD = 2000; // Mostrar aviso a los 2 segundos de silencio

        if (average < SILENCE_THRESHOLD) {
            if (!silenceStartRef.current) {
                silenceStartRef.current = Date.now();
            } else {
                const silenceDuration = Date.now() - silenceStartRef.current;
                
                // Mostrar cuenta regresiva si estamos cerca del límite
                if (silenceDuration > WARNING_THRESHOLD) {
                    const remainingSeconds = Math.ceil((MAX_SILENCE_DURATION - silenceDuration) / 1000);
                    setSilenceWarning(remainingSeconds > 0 ? remainingSeconds : 0);
                }

                // Detener si excedemos el tiempo máximo
                if (silenceDuration >= MAX_SILENCE_DURATION) {
                    stopRecording(true); // true indica parada automática
                    return;
                }
            }
        } else {
            // Se detectó voz, resetear temporizadores
            silenceStartRef.current = null;
            setSilenceWarning(null);
        }

        animationFrameRef.current = requestAnimationFrame(() => detectSilence(analyser, dataArray));
    };

    const startRecording = async () => {
        try {
            // ... (verificaciones existentes) ...
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                // ... (fallback code) ...
                // @ts-ignore
                const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                if (!getUserMedia) {
                    throw new Error('Tu navegador no soporta grabación de audio. Intenta usar Chrome o Safari actualizado en HTTPS.');
                }
            }

            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                 throw new Error('La grabación requiere una conexión segura (HTTPS).');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Configurar Web Audio API para detección de silencio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            silenceStartRef.current = null;
            setSilenceWarning(null);
            detectSilence(analyser, dataArray);

            const mimeType = getSupportedMimeType();
            // ... (resto de inicialización de MediaRecorder) ...
            
            console.log('Using MIME type:', mimeType);

            mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = async () => {
                // Limpiar contexto de audio y animación
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
                setSilenceWarning(null);

                const type = mediaRecorder.current?.mimeType || mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks.current, { type });
                
                // Determine extension based on type
                let extension = 'wav';
                if (type.includes('mp4') || type.includes('aac')) extension = 'm4a';
                else if (type.includes('webm')) extension = 'webm';
                else if (type.includes('ogg')) extension = 'ogg';

                const formData = new FormData();
                formData.append('file', audioBlob, `audio.${extension}`);

                startTransition(async () => {
                    try {
                        const text = await transcribeAudio(formData);
                        setInput(text);
                        toast.success('Audio transcrito con éxito 🎙️');
                    } catch (error) {
                        toast.error('Error al transcribir el audio');
                        console.error(error);
                    }
                });
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            toast.error('No se pudo acceder al micrófono');
            console.error(err);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf';
        toast.info(`Analizando ${isPdf ? 'PDF' : 'imagen'} con IA... 📸`);

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            try {
                const result = isPdf
                    ? await extractFromPdf(formData)
                    : await extractFromImage(formData);

                if (Array.isArray(result)) {
                    if (onTransactionAdded) {
                        onTransactionAdded(result);
                    }
                    for (const t of result) {
                        await saveTransaction(t);
                    }
                    toast.success(`${result.length} gastos procesados y guardados ✨`);
                } else if (!('type' in result)) {
                    if (onTransactionAdded) {
                        onTransactionAdded([result as Transaction]);
                    }
                    await saveTransaction(result as Transaction);
                    toast.success('Documento procesado y guardado ✨');
                }
            } catch (error) {
                toast.error(`Error al procesar el ${isPdf ? 'PDF' : 'archivo'}`);
                console.error(error);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const rawText = input;
        setInput(''); // Clear immediately

        startTransition(async () => {
            try {
                // Call simulated AI
                const result = await extractTransactionDetails(rawText);

                if (Array.isArray(result)) {
                    if (onTransactionAdded) {
                        onTransactionAdded(result);
                    }
                    // It's a list of transactions
                    for (const t of result) {
                        await saveTransaction(t);
                    }
                    toast.success(`${result.length} gastos registrados mágicamente ✨`);
                } else if (!('type' in result)) {
                    if (onTransactionAdded) {
                        onTransactionAdded([result as Transaction]);
                    }
                    // It's a single transaction (fallback)
                    await saveTransaction(result as Transaction);
                    toast.success('Gasto registrado mágicamente ✨');
                } else {
                    toast.info('AI ha respondido a tu pregunta');
                }

            } catch (error) {
                toast.error('Hubo un error al procesar');
                setInput(rawText); // Restore on error
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

    const hasContent = input.trim().length > 0;
    const showCamera = !hasContent && !isRecording;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="relative flex items-end bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl transition-all duration-300 focus-within:ring-1 focus-within:ring-white/10 focus-within:border-white/20">
                    
                    {/* Botón Limpiar (Top Right) */}
                    <div className={cn(
                        "absolute top-2 right-2 z-20 transition-all duration-300",
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
                                    <span className="text-xs font-medium">¿Borrar?</span>
                                </>
                            ) : (
                                <X className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>

                    {/* Iconos Izquierda (Mic, Camera, Type Indicator) */}
                    <div className="flex items-center gap-1 pl-3 pb-3 h-[60px] transition-all duration-300"> 
                         {isRecording ? (
                            <button
                                type="button"
                                onClick={() => stopRecording(false)}
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
                                "overflow-hidden transition-all duration-300 flex items-center",
                                hasContent ? "w-0 opacity-0 scale-0" : "w-10 opacity-100 scale-100"
                            )}>
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="text-zinc-400 hover:text-indigo-400 transition-all duration-300 cursor-pointer p-2 hover:bg-white/5 rounded-full"
                                >
                                    <Mic className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        <div className={cn(
                            "overflow-hidden transition-all duration-300 flex items-center",
                            showCamera ? "w-10 opacity-100 scale-100" : "w-0 opacity-0 scale-0"
                        )}>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer p-2 hover:bg-white/5 rounded-full whitespace-nowrap"
                            >
                                <Camera className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                        />

                        <div className="h-6 w-[1px] bg-white/10 mx-1" />

                        <div className="p-2">
                            {isQuestion ? (
                                <MessageSquare className={cn("w-5 h-5 text-indigo-500 transition-all", isPending ? "animate-bounce" : "")} />
                            ) : (
                                <Sparkles className={cn("w-5 h-5 text-indigo-500 transition-all", isPending ? "animate-pulse" : "")} />
                            )}
                        </div>
                    </div>

                    {/* Textarea Auto-expansible */}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isPending || isRecording}
                        placeholder={isRecording ? "Escuchando..." : (isQuestion ? "¿Qué quieres saber?" : "¿En qué gastaste hoy?")}
                        rows={1}
                        className={cn(
                            "w-full bg-transparent text-lg text-foreground placeholder:text-muted-foreground/50 outline-none resize-none min-h-[60px] max-h-[200px] overflow-y-auto transition-all duration-300",
                            hasContent ? "pt-10 pb-4 pl-4 pr-4" : "py-4 pl-2 pr-14"
                        )}
                        style={{ lineHeight: '1.5' }}
                    />

                    {/* Botón de Enviar (Derecha Abajo) */}
                    <div className="absolute right-2 bottom-2 z-10">
                        <button
                            type="submit"
                            disabled={!input.trim() || isPending || isRecording}
                            className={cn(
                                "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
                                (input.trim() && !isRecording) 
                                    ? "bg-white text-black shadow-lg hover:scale-105 active:scale-95" 
                                    : "bg-white/5 text-muted-foreground opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
