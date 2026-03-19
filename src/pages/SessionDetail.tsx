import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, Clock, User, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { THERAPIST_PROFILES } from "@/lib/therapists-data";

interface TranscriptEntry {
  content: string;
  isTherapist: boolean;
  timestamp?: string;
}

interface SessionData {
  id: string;
  therapistId: string;
  prompt: string;
  status: string;
  summary?: string;
  createdAt: string;
  endedAt?: string;
  participants?: { names: string[]; relationship: string; context: string } | null;
}

export default function SessionDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [sessionRes, transcriptRes] = await Promise.all([
          apiFetch(`/sessions/${id}`),
          apiFetch(`/sessions/${id}/transcript`),
        ]);

        if (!sessionRes.ok) throw new Error("Session not found");
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json();
          setTranscript(transcriptData.entries || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const therapist = session ? THERAPIST_PROFILES.find((tp) => tp.id === session.therapistId) : null;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-stone-500">{error || "Session not found"}</p>
        <Link to="/dashboard" className="text-sm font-medium text-rose-500 hover:text-rose-600">
          <ArrowLeft className="mr-1 inline h-4 w-4" /> {t("history.backToDashboard")}
        </Link>
      </div>
    );
  }

  const duration = session.endedAt
    ? Math.round(
        (new Date(session.endedAt).getTime() - new Date(session.createdAt).getTime()) / 60000,
      )
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {t("history.backToDashboard")}
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {therapist && (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-500">
                  {therapist.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-stone-900">
                  {therapist?.name || session.therapistId}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                  <span>
                    {new Date(session.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {duration} {t("history.minutes")}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      session.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {session.status === "completed" ? t("history.completed") : t("history.active")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {session.participants?.names && session.participants.names.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
              <User className="h-3.5 w-3.5" />
              {session.participants.names.join(", ")}
              {session.participants.relationship && (
                <span className="text-stone-400">({session.participants.relationship})</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary */}
        {session.summary && (
          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              {t("history.summary")}
            </h2>
            <p className="mt-3 text-stone-700 leading-relaxed">{session.summary}</p>
          </div>
        )}

        {/* Session Focus */}
        {session.prompt && (
          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              {t("history.sessionFocus")}
            </h2>
            <p className="mt-3 text-stone-700">{session.prompt}</p>
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-400">
              <MessageSquare className="h-4 w-4" /> {t("history.transcript")}
            </h2>
            <div className="space-y-4">
              {transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${entry.isTherapist ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      entry.isTherapist
                        ? "bg-rose-100 text-rose-500"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {entry.isTherapist
                      ? therapist?.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2) || "T"
                      : "P"}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      entry.isTherapist
                        ? "bg-stone-100 text-stone-800"
                        : "bg-rose-50 text-stone-800"
                    }`}
                  >
                    {entry.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white px-8 py-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-stone-300" />
            <p className="mt-3 text-stone-500">{t("history.noTranscript")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
