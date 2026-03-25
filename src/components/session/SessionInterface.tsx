import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Phone, Volume2, VolumeX, Clock, X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TherapistProfile, TranscriptEntry, ParticipantInfo } from "@/types";
import { apiFetch } from "@/lib/api";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import TranscriptPanel from "./TranscriptPanel";

interface SessionInterfaceProps {
  sessionId: string;
  therapist: TherapistProfile;
  sessionPrompt: string;
  sessionParticipants?: ParticipantInfo | null;
}

const THERAPIST_RESPONSE_DELAY = 3000;

export default function SessionInterface({
  sessionId,
  therapist,
  sessionPrompt,
  sessionParticipants,
}: SessionInterfaceProps) {
  const { t } = useTranslation();

  const participants = sessionParticipants || null;

  // Session state
  const [started, setStarted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [interimText, setInterimText] = useState("");
  const [sessionError, setSessionError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullTranscriptRef = useRef<TranscriptEntry[]>([]);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTTSPlayingRef = useRef(false);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceStopRef = useRef<() => void>(() => {});
  const voicePauseRef = useRef<() => void>(() => {});
  const voiceResumeRef = useRef<() => void>(() => {});

  const showError = useCallback((message: string) => {
    setSessionError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setSessionError(null), 6000);
  }, []);

  // Session timer
  useEffect(() => {
    if (started) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [started]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const addTranscriptEntry = useCallback((content: string, isTherapist: boolean) => {
    const entry: TranscriptEntry = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
      isTherapist,
    };
    fullTranscriptRef.current = [...fullTranscriptRef.current, entry];
    setTranscript((prev) => [...prev, entry]);
    return entry;
  }, []);

  const playAudio = useCallback(
    async (audioUrl: string): Promise<void> => {
      if (isMuted) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      try {
        isTTSPlayingRef.current = true;
        voicePauseRef.current();
        setIsSpeaking(true);

        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        return new Promise((resolve) => {
          source.onended = () => {
            setIsSpeaking(false);
            isTTSPlayingRef.current = false;
            voiceResumeRef.current();
            resolve();
          };
          source.start(0);
        });
      } catch {
        setIsSpeaking(false);
        isTTSPlayingRef.current = false;
        voiceResumeRef.current();
      }
    },
    [isMuted],
  );

  const getTherapistResponse = useCallback(
    async (currentTranscript: TranscriptEntry[]) => {
      setIsProcessing(true);

      try {
        const res = await apiFetch("/sessions/respond", {
          method: "POST",
          body: JSON.stringify({
            sessionId,
            therapistId: therapist.id,
            prompt: sessionPrompt,
            participants: participants || undefined,
            transcript: currentTranscript.map((e) => ({
              content: e.content,
              isTherapist: e.isTherapist,
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to get therapist response");

        const data = await res.json();
        setIsProcessing(false);

        if (data.text) {
          addTranscriptEntry(data.text, true);

          try {
            const ttsRes = await apiFetch("/voice/speak", {
              method: "POST",
              body: JSON.stringify({
                therapistId: therapist.id,
                text: data.text,
              }),
            });
            if (ttsRes.ok) {
              const ttsData = await ttsRes.json();
              if (ttsData.audioUrl) {
                await playAudio(ttsData.audioUrl);
              }
            }
          } catch {
            // TTS failed silently — text response is still shown in transcript
          }
        }
      } catch {
        showError(t("session.responseError"));
        setIsProcessing(false);
      }
    },
    [
      sessionId,
      therapist.id,
      sessionPrompt,
      participants,
      addTranscriptEntry,
      playAudio,
      showError,
      t,
    ],
  );

  const handleTranscript = useCallback(
    (text: string) => {
      addTranscriptEntry(text, false);
      setInterimText("");

      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = setTimeout(() => {
        getTherapistResponse(fullTranscriptRef.current);
      }, THERAPIST_RESPONSE_DELAY);
    },
    [addTranscriptEntry, getTherapistResponse],
  );

  const handleInterim = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  const voiceRecorder = useVoiceRecorder({
    onTranscript: handleTranscript,
    onInterim: handleInterim,
    silenceDuration: 1500,
    volumeThreshold: 15,
  });
  const { start: voiceStart, stop: voiceStop } = voiceRecorder;
  voiceStopRef.current = voiceStop;
  voicePauseRef.current = voiceRecorder.pause;
  voiceResumeRef.current = voiceRecorder.resume;

  const handleStart = useCallback(async () => {
    setStarted(true);

    const namesList = participants?.names.filter(Boolean) || [];
    const greeting =
      namesList.length > 0
        ? `Hello ${namesList.join(" and ")}! Welcome to our session. I'm ${therapist.name}. ${sessionPrompt ? "I understand you'd like to work through some things today. Let's begin." : "How can I help you today?"}`
        : `Hello, welcome to our session. I'm ${therapist.name}. ${sessionPrompt ? "I understand you'd like to work through some things today. Let's begin." : "How can I help you today?"}`;

    try {
      const res = await apiFetch("/voice/speak", {
        method: "POST",
        body: JSON.stringify({
          therapistId: therapist.id,
          text: greeting,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addTranscriptEntry(data.text || greeting, true);
        if (data.audioUrl) {
          await playAudio(data.audioUrl);
        }
      }
    } catch {
      addTranscriptEntry(greeting, true);
    }

    await voiceStart();
  }, [therapist, sessionPrompt, participants, addTranscriptEntry, playAudio, voiceStart]);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      voiceStop();
    } else {
      voiceStart();
    }
    setIsMicOn((prev) => !prev);
  }, [isMicOn, voiceStop, voiceStart]);

  const handleEndSession = useCallback(async () => {
    voiceStop();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setShowEndModal(false);

    try {
      await apiFetch(`/sessions/${sessionId}/end`, {
        method: "POST",
        body: JSON.stringify({
          transcript: fullTranscriptRef.current.map((e) => ({
            content: e.content,
            isTherapist: e.isTherapist,
            timestamp: e.timestamp.toISOString(),
          })),
        }),
      });
    } catch {
      // Session end save failed — user is redirecting to dashboard anyway
    }

    window.location.href = "/dashboard";
  }, [voiceStop, sessionId]);

  useEffect(() => {
    return () => {
      voiceStopRef.current();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --- Ready to begin ---
  if (!started) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-rose-200">
            <img
              src={therapist.imageUrl}
              alt={therapist.name}
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">{t("session.readyToBegin")}</h2>
          <p className="mt-2 text-stone-500">
            {t("session.sessionReady", { name: therapist.name })}
          </p>
          <p className="mt-1 text-sm text-stone-400">{t("session.micEnabled")}</p>
          {participants && participants.names.length > 0 && (
            <p className="mt-2 text-sm text-stone-500">
              {t("session.participants")}:{" "}
              <span className="font-medium">{participants.names.join(", ")}</span>
            </p>
          )}
        </div>

        <button
          onClick={handleStart}
          className="group flex h-24 w-24 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-105 hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-500/40"
        >
          <Mic className="h-10 w-10 transition-transform group-hover:scale-110" />
        </button>

        <p className="text-sm text-stone-400">{t("session.tapToStart")}</p>
      </div>
    );
  }

  // --- Active session ---
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-rose-200">
            <img
              src={therapist.imageUrl}
              alt={therapist.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-stone-800">{therapist.name}</h3>
            <p className="text-xs text-stone-400">{therapist.title}</p>
          </div>
          {isSpeaking && (
            <div className="ml-2 flex items-center gap-0.5">
              <span
                className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-rose-500"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block h-4 w-0.5 animate-pulse rounded-full bg-rose-500"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-rose-500"
                style={{ animationDelay: "300ms" }}
              />
              <span
                className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-rose-500"
                style={{ animationDelay: "100ms" }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          <Clock className="h-4 w-4" />
          <span className="font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Transcript Area */}
      <div className="flex-1 overflow-hidden bg-stone-50">
        <TranscriptPanel transcript={transcript} therapistName={therapist.name} />

        {interimText && (
          <div className="px-6 py-2">
            <span className="text-sm italic text-stone-400">{interimText}...</span>
          </div>
        )}

        {voiceRecorder.isTranscribing && (
          <div className="flex items-center gap-2 px-6 py-2">
            <div className="flex items-center gap-1">
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-xs text-stone-400">{t("session.transcribing")}</span>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 px-6 py-3">
            <div className="flex items-center gap-1">
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-rose-400"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-rose-400"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-rose-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm text-stone-400">
              {t("session.isThinking", { name: therapist.name.split(" ")[0] })}
            </span>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {sessionError && (
        <div className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">{sessionError}</p>
          <button
            onClick={() => setSessionError(null)}
            className="rounded p-0.5 text-red-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="border-t border-stone-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-center gap-6">
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isMuted
                ? "bg-stone-200 text-stone-500"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
            title={isMuted ? t("session.unmuteTherapist") : t("session.muteTherapist")}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleMic}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
              isMicOn
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600"
                : "bg-stone-300 text-stone-600 hover:bg-stone-400"
            }`}
            title={isMicOn ? t("session.muteMic") : t("session.unmuteMic")}
          >
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>

          <button
            onClick={() => setShowEndModal(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
            title={t("session.endSession")}
          >
            <Phone className="h-5 w-5 rotate-[135deg]" />
          </button>
        </div>
      </div>

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">{t("session.endSession")}</h3>
              <button
                onClick={() => setShowEndModal(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6 text-sm text-stone-500">{t("session.endSessionMessage")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                {t("session.continueSession")}
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                {t("session.endSession")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
