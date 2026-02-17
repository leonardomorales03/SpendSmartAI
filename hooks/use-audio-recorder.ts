'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

type UseAudioRecorderOptions = {
    onTranscription: (text: string) => void
    getMessage: (key: string) => string
    transcribe: (formData: FormData) => Promise<string>
}

export function useAudioRecorder({ onTranscription, getMessage, transcribe }: UseAudioRecorderOptions) {
    const [isRecording, setIsRecording] = useState(false)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const silenceStartRef = useRef<number | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const [silenceWarning, setSilenceWarning] = useState<number | null>(null)

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
        return '';
    };

    const stopRecording = (autoStopped = false) => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            
            if (autoStopped) {
                toast.info(getMessage('magicInput.silence_stop'));
            }
        }
    };

    const detectSilence = (analyser: AnalyserNode, dataArray: Uint8Array) => {
        analyser.getByteFrequencyData(dataArray as unknown as Uint8Array<ArrayBuffer>);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        const SILENCE_THRESHOLD = 10; 
        const MAX_SILENCE_DURATION = 5000;
        const WARNING_THRESHOLD = 2000;

        if (average < SILENCE_THRESHOLD) {
            if (!silenceStartRef.current) {
                silenceStartRef.current = Date.now();
            } else {
                const silenceDuration = Date.now() - silenceStartRef.current;
                
                if (silenceDuration > WARNING_THRESHOLD) {
                    const remainingSeconds = Math.ceil((MAX_SILENCE_DURATION - silenceDuration) / 1000);
                    setSilenceWarning(remainingSeconds > 0 ? remainingSeconds : 0);
                }

                if (silenceDuration >= MAX_SILENCE_DURATION) {
                    stopRecording(true);
                    return;
                }
            }
        } else {
            silenceStartRef.current = null;
            setSilenceWarning(null);
        }

        animationFrameRef.current = requestAnimationFrame(() => detectSilence(analyser, dataArray));
    };

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(getMessage('magicInput.browser_not_supported'));
            }

            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                throw new Error(getMessage('magicInput.secure_connection_required'));
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const AudioContextConstructor: typeof AudioContext =
                // @ts-expect-error webkitAudioContext is not in the standard lib typings
                window.AudioContext || window.webkitAudioContext;

            const audioContext = new AudioContextConstructor();
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
            mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = async () => {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
                setSilenceWarning(null);

                const type = mediaRecorder.current?.mimeType || mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks.current, { type });
                
                let extension = 'wav';
                if (type.includes('mp4') || type.includes('aac')) extension = 'm4a';
                else if (type.includes('webm')) extension = 'webm';
                else if (type.includes('ogg')) extension = 'ogg';

                const formData = new FormData();
                formData.append('file', audioBlob, `audio.${extension}`);

                try {
                    const text = await transcribe(formData);
                    onTranscription(text);
                    toast.success(getMessage('magicInput.audio_transcribed'));
                } catch (error) {
                    toast.error(getMessage('magicInput.transcription_error'));
                    console.error(error);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            toast.error(getMessage('magicInput.mic_error'));
            console.error(err);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording(false);
        } else {
            startRecording();
        }
    };

    return {
        isRecording,
        silenceWarning,
        toggleRecording,
    };
}
