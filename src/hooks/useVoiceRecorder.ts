import { useRef, useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";

interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  silenceThreshold?: number;
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

export function useVoiceRecorder({
  onTranscript,
  onInterim,
  silenceDuration = 1500,
  volumeThreshold = 15,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isSpeakingRef = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const activeRef = useRef(false);

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
      if (blob.size < 1000) return; // Skip tiny clips (noise/clicks)

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

    recorder.start(100); // Collect data every 100ms
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

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    activeRef.current = true;
    pausedRef.current = false;
    setIsRecording(true);

    // Voice activity detection loop
    vadIntervalRef.current = setInterval(() => {
      if (pausedRef.current || !activeRef.current) return;

      const volume = getVolume();

      if (volume > volumeThreshold) {
        // Speech detected
        silenceStartRef.current = null;

        if (!isSpeakingRef.current) {
          // Speech just started — begin recording
          isSpeakingRef.current = true;
          startNewRecording();
        }
      } else if (isSpeakingRef.current) {
        // Silence while was speaking
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        } else if (Date.now() - silenceStartRef.current > silenceDuration) {
          // Silence exceeded threshold — end this utterance
          isSpeakingRef.current = false;
          silenceStartRef.current = null;
          stopCurrentRecording();
        }
      }
    }, 100);
  }, [volumeThreshold, silenceDuration, getVolume, startNewRecording, stopCurrentRecording]);

  const stop = useCallback(() => {
    activeRef.current = false;
    pausedRef.current = false;

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    // If currently recording, stop and send final chunk
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

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      stopCurrentRecording();
    }
    silenceStartRef.current = null;
  }, [stopCurrentRecording]);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  return {
    start,
    stop,
    pause,
    resume,
    isRecording,
    isTranscribing,
  };
}
