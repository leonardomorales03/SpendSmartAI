import Groq from "groq-sdk";

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const GROQ_MODELS = {
    TEXT_GENERAL: process.env.GROQ_MODEL_TEXT_GENERAL || "llama-3.3-70b-versatile",
    TEXT_FINANCIAL_CHAT: process.env.GROQ_MODEL_TEXT_FINANCIAL_CHAT || "llama-3.3-70b-versatile",
    AUDIO_TRANSCRIPTION: process.env.GROQ_MODEL_AUDIO_TRANSCRIPTION || "whisper-large-v3",
    IMAGE_EXTRACTION: process.env.GROQ_MODEL_IMAGE_EXTRACTION || "meta-llama/llama-4-scout-17b-16e-instruct",
};
