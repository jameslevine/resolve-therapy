import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, FileText, ArrowRight, Loader2, CreditCard, Plus } from "lucide-react";
import { apiFetch } from "../lib/api";
import { THERAPIST_PROFILES } from "../lib/therapists-data";
import { useAuthStore } from "@/store/auth";
import { useCreditsStore } from "@/store/credits";

interface SessionRecord {
  id: string;
  therapistId: string;
  status: string;
  createdAt: string;
  summary?: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { balance, fetchBalance } = useCreditsStore();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.sub) fetchBalance(user.sub);
  }, [user?.sub, fetchBalance]);

  useEffect(() => {
    if (!user?.sub) return;
    const fetchSessions = async () => {
      try {
        const res = await apiFetch(`/sessions?userId=${encodeURIComponent(user!.sub)}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [user?.sub]);

  const getTherapistName = (therapistId: string) => {
    return (
      THERAPIST_PROFILES.find((tp) => tp.id === therapistId)?.name ??
      t("dashboard.unknownTherapist")
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="bg-white border-b border-stone-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">{t("dashboard.title")}</h1>
              <p className="mt-2 text-stone-600">{t("dashboard.subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/new-session"
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
              >
                <Plus className="h-4 w-4" />
                {t("common.newSession")}
              </Link>
              <Link
                to="/credits"
                className="inline-flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-3 transition hover:shadow-md"
              >
                <CreditCard className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-xs text-stone-500">{t("credits.currentBalance")}</p>
                  <p className="text-lg font-bold text-stone-900">
                    {balance}{" "}
                    <span className="text-sm font-normal text-stone-500">
                      {t("credits.minutes")}
                    </span>
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white px-8 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-4 text-lg font-semibold text-stone-700">
                {t("dashboard.noSessions")}
              </h3>
              <p className="mt-2 text-sm text-stone-500">{t("dashboard.noSessionsDesc")}</p>
              <Link
                to="/new-session"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
              >
                {t("dashboard.browseTherapists")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => {
                const detailUrl =
                  session.status === "completed"
                    ? `/session/${session.id}/detail`
                    : `/session/${session.id}`;
                return (
                  <Link
                    key={session.id}
                    to={detailUrl}
                    className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-6 py-5 transition hover:shadow-md"
                  >
                    <div>
                      <p className="font-semibold text-stone-900">
                        {getTherapistName(session.therapistId)}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${session.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {session.status === "completed"
                            ? t("history.completed")
                            : t("history.active")}
                        </span>
                      </div>
                      {session.summary && (
                        <p className="mt-2 text-sm text-stone-600 line-clamp-2">
                          {session.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 rounded-full bg-stone-100 p-2 text-stone-500">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
