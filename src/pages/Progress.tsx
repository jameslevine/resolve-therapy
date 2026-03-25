import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, TrendingUp, Clock, Calendar, Heart, AlertCircle, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { THERAPIST_PROFILES } from "@/lib/therapists-data";

interface SessionHistoryItem {
  id: string;
  date: string;
  therapistId: string;
  minutesUsed: number;
  communicationScore: number | null;
}

interface ProgressData {
  totalSessions: number;
  totalMinutes: number;
  averageScore: number | null;
  favoriteTherapist: string | null;
  sessionHistory: SessionHistoryItem[];
}

export default function Progress() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.sub) return;
    apiFetch("/sessions/progress")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load progress");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.sub]);

  const getTherapistName = (id: string) =>
    THERAPIST_PROFILES.find((tp) => tp.id === id)?.name ?? id;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-stone-500">{error || "Failed to load progress"}</p>
      </div>
    );
  }

  const scores = data.sessionHistory
    .filter((s) => s.communicationScore !== null)
    .map((s) => ({ date: s.date, score: s.communicationScore! }));

  const maxScore = 10;

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-stone-900">{t("progress.title")}</h1>
          <p className="mt-2 text-stone-600">{t("progress.subtitle")}</p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-100 p-2.5">
                  <Calendar className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{data.totalSessions}</p>
                  <p className="text-xs text-stone-500">{t("progress.totalSessions")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-2.5">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{data.totalMinutes}</p>
                  <p className="text-xs text-stone-500">{t("progress.totalMinutes")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2.5">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-900">{data.averageScore ?? "—"}</p>
                  <p className="text-xs text-stone-500">{t("progress.avgScore")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-2.5">
                  <Heart className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-stone-900 truncate">
                    {data.favoriteTherapist ? getTherapistName(data.favoriteTherapist) : "—"}
                  </p>
                  <p className="text-xs text-stone-500">{t("progress.favoriteTherapist")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Communication Score Chart */}
          {scores.length > 1 && (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
                {t("progress.scoreOverTime")}
              </h2>
              <div className="mt-4 flex h-48 items-end gap-1">
                {scores.map((s, i) => (
                  <div key={i} className="group relative flex flex-1 flex-col items-center">
                    <div className="absolute -top-6 hidden rounded bg-stone-800 px-2 py-1 text-xs text-white group-hover:block">
                      {s.score}/10
                    </div>
                    <div
                      className="w-full max-w-[40px] rounded-t bg-gradient-to-t from-rose-400 to-rose-300 transition-all hover:from-rose-500 hover:to-rose-400"
                      style={{ height: `${(s.score / maxScore) * 100}%` }}
                    />
                    <p className="mt-1 text-[10px] text-stone-400 truncate max-w-[40px]">
                      {new Date(s.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session History */}
          {data.sessionHistory.length > 0 && (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
                {t("progress.recentSessions")}
              </h2>
              <div className="mt-4 space-y-3">
                {data.sessionHistory
                  .slice()
                  .reverse()
                  .map((s) => (
                    <Link
                      key={s.id}
                      to={`/session/${s.id}/detail`}
                      className="flex items-center justify-between rounded-xl border border-stone-100 px-4 py-3 transition hover:bg-stone-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <p className="font-medium text-stone-800">
                            {getTherapistName(s.therapistId)}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(s.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                            {s.minutesUsed > 0 && ` · ${s.minutesUsed} min`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.communicationScore !== null && (
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                            {s.communicationScore}/10
                          </span>
                        )}
                        <ArrowRight className="h-4 w-4 text-stone-400" />
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {data.totalSessions === 0 && (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white px-8 py-16 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-4 text-lg font-semibold text-stone-700">{t("progress.noData")}</h3>
              <p className="mt-2 text-sm text-stone-500">{t("progress.noDataDesc")}</p>
              <Link
                to="/new-session"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
              >
                {t("common.startSession")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
