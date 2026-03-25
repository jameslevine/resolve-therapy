import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Loader2, CreditCard } from "lucide-react";
import type { TherapistProfile } from "../../types";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "@/store/auth";
import { useCreditsStore } from "@/store/credits";

interface BookingModalProps {
  therapist: TherapistProfile;
  onClose: () => void;
}

export default function BookingModal({ therapist, onClose }: BookingModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { balance, fetchBalance } = useCreditsStore();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.sub) fetchBalance();
  }, [user?.sub, fetchBalance]);

  const handleStartSession = async () => {
    if (!user?.sub) {
      navigate("/login", { state: { from: `/therapists/${therapist.id}` } });
      return;
    }
    if (balance < 1) {
      navigate("/credits");
      onClose();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/sessions/start", {
        method: "POST",
        body: JSON.stringify({
          therapistId: therapist.id,
          prompt,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          navigate("/credits");
          onClose();
          return;
        }
        throw new Error(data.error || "Failed to start session");
      }
      const data = await res.json();
      navigate(`/session/${data.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("booking.error"));
      setLoading(false);
    }
  };

  const hasCredits = balance >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900">{t("booking.title")}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3">
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-rose-100 to-rose-200">
            {therapist.imageUrl ? (
              <img
                src={therapist.imageUrl}
                alt={therapist.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-rose-400">
                {therapist.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-stone-900">{therapist.name}</p>
            <p className="text-xs text-stone-500">{therapist.specialty}</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-stone-700">
            {t("booking.sessionFocus")}{" "}
            <span className="font-normal text-stone-400">({t("booking.optional")})</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder={t("booking.placeholder")}
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-medium text-stone-700">{t("credits.cost")}</span>
          </div>
          <div className="text-end">
            <span className="text-lg font-bold text-rose-600">1 {t("credits.credit")}</span>
            <p className="text-xs text-stone-500">
              {t("credits.balanceLabel")}: {balance}
            </p>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            {t("common.cancel")}
          </button>
          {hasCredits ? (
            <button
              onClick={handleStartSession}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("booking.startSession")}
            </button>
          ) : (
            <button
              onClick={() => {
                navigate("/credits");
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
            >
              {t("credits.buyCredits")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
