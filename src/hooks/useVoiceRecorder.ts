import { useRef, useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  silenceDuration?: number;
  volumeThreshold?: number;
}

interface UseVoiceRecorderReturn {
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
}

// Check for Web Speech API support
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
const SpeechRecognition: SpeechRecognitionConstructor | undefined =
  w.SpeechRecognition || w.webkitSpeechRecognition;

export function useVoiceRecorder({
  onTranscript,
  onInterim,
  silenceDuration = 1500,
  volumeThreshold = 5,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const activeRef = useRef(false);
  const pausedRef = useRef(false);

  // Web Speech API refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Fallback refs (MediaRecorder + AWS Transcribe)
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isSpeakingRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);

  // ---- Web Speech API approach (fast, real-time) ----

  const startWebSpeech = useCallback(async () => {
    const recognition = new SpeechRecognition!();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (pausedRef.current) return;

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            onTranscript(text);
            onInterim?.("");
          }
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        onInterim?.(interim);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still active (browser stops after silence)
      if (activeRef.current && !pausedRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;
    activeRef.current = true;
    pausedRef.current = false;
    setIsRecording(true);

    // Request mic permission (needed for the recording indicator)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    recognition.start();
  }, [onTranscript, onInterim]);

  const stopWebSpeech = useCallback(() => {
    activeRef.current = false;
    pausedRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const pauseWebSpeech = useCallback(() => {
    pausedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
  }, []);

  const resumeWebSpeech = useCallback(() => {
    pausedRef.current = false;
    if (recognitionRef.current && activeRef.current) {
      recognitionRef.current.onend = () => {
        if (activeRef.current && !pausedRef.current) {
          try {
            recognitionRef.current?.start();
          } catch {
            // Already started
          }
        }
      };
      try {
        recognitionRef.current.start();
      } catch {
        // Already started
      }
    }
  }, []);

  // ---- Fallback: MediaRecorder + AWS Transcribe (for unsupported browsers) ----

  const getMimeType = useCallback((): string => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  }, []);

  const getFormatFromMime = useCallback((mime: string): string => {
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("mp4")) return "mp4";
    return "webm";
  }, []);

  const sendAudioForTranscription = useCallback(
    async (blob: Blob, format: string) => {
      if (blob.size < 1000) return;

      setIsTranscribing(true);
      onInterim?.("...");

      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
        );

        const res = await apiFetch("/voice/transcribe", {
          method: "POST",
          body: JSON.stringify({ audio: base64, format }),
        });

        if (res.ok) {
          const data = await res.json();
          const text =
            data.transcript || (data.segments || []).map((s: { text: string }) => s.text).join(" ");

          if (text.trim()) {
            onTranscript(text.trim());
          }
        }
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setIsTranscribing(false);
        onInterim?.("");
      }
    },
    [onTranscript, onInterim],
  );

  const startNewRecording = useCallback(() => {
    if (!streamRef.current || pausedRef.current || !activeRef.current) return;

    const mimeType = getMimeType();
    if (!mimeType) return;

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const format = getFormatFromMime(mimeType);
        sendAudioForTranscription(blob, format);
      }
      chunksRef.current = [];
    };

    recorder.start(100);
    mediaRecorderRef.current = recorder;
  }, [getMimeType, getFormatFromMime, sendAudioForTranscription]);

  const stopCurrentRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }, []);

  const getVolume = useCallback((): number => {
    if (!analyserRef.current) return 0;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const sum = dataArray.reduce((a, b) => a + b, 0);
    return sum / dataArray.length;
  }, []);

  const startFallback = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    activeRef.current = true;
    pausedRef.current = false;
    setIsRecording(true);

    vadIntervalRef.current = setInterval(() => {
      if (pausedRef.current || !activeRef.current) return;

      const volume = getVolume();

      if (volume > volumeThreshold) {
        silenceStartRef.current = null;
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          startNewRecording();
        }
      } else if (isSpeakingRef.current) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current > silenceDuration) {
          isSpeakingRef.current = false;
          silenceStartRef.current = null;
          stopCurrentRecording();
        }
      }
    }, 100);
  }, [volumeThreshold, silenceDuration, getVolume, startNewRecording, stopCurrentRecording]);

  const stopFallback = useCallback(() => {
    activeRef.current = false;
    pausedRef.current = false;

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      stopCurrentRecording();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    silenceStartRef.current = null;
    setIsRecording(false);
  }, [stopCurrentRecording]);

  const pauseFallback = useCallback(() => {
    pausedRef.current = true;
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      stopCurrentRecording();
    }
    silenceStartRef.current = null;
  }, [stopCurrentRecording]);

  const resumeFallback = useCallback(() => {
    pausedRef.current = false;
  }, []);

  // ---- Public API: delegates to Web Speech or fallback ----

  const useWebSpeech = !!SpeechRecognition;

  const start = useCallback(async () => {
    if (useWebSpeech) {
      await startWebSpeech();
    } else {
      await startFallback();
    }
  }, [useWebSpeech, startWebSpeech, startFallback]);

  const stop = useCallback(() => {
    if (useWebSpeech) {
      stopWebSpeech();
    } else {
      stopFallback();
    }
  }, [useWebSpeech, stopWebSpeech, stopFallback]);

  const pause = useCallback(() => {
    if (useWebSpeech) {
      pauseWebSpeech();
    } else {
      pauseFallback();
    }
  }, [useWebSpeech, pauseWebSpeech, pauseFallback]);

  const resume = useCallback(() => {
    if (useWebSpeech) {
      resumeWebSpeech();
    } else {
      resumeFallback();
    }
  }, [useWebSpeech, resumeWebSpeech, resumeFallback]);

  return {
    start,
    stop,
    pause,
    resume,
    isRecording,
    isTranscribing,
  };
}
