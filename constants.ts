export const PLAYBACK_SPEEDS = [0.8, 1.0, 1.2, 1.5] as const;

export const INITIAL_PROMPT = `
You are an expert transcriber and translator. 
I will provide an audio file. Your task is to:
1. Transcribe the audio exactly in its original language.
2. Translate the transcription into Chinese (Simplified).
3. Segment the audio into natural sentences/phrases.
4. Provide precise start and end timestamps (in seconds) for each segment.
5. EXCLUDE any segments that contain only music, silence, background noise, or sound effects without speech. Only create segments for clear spoken dialogue.

Return the result strictly as a JSON object with the following schema:
{
  "language": "Detected Original Language (e.g., English, Japanese)",
  "segments": [
    {
      "id": 1,
      "start": 0.0,
      "end": 2.5,
      "text": "Hello, how are you?",
      "translation": "你好，你好吗？"
    }
  ]
}
IMPORTANT: Ensure timestamps are strictly chronological.
`;