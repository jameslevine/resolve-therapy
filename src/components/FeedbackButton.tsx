import { useState } from "react";
import { MessageSquarePlus, X, Bug, MessageCircle, Lightbulb, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth";
import { apiFetch } from "@/lib/api";

type FeedbackType = "bug" | "feedback" | "feature";

export default function FeedbackButton() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/sessions/feedback", {
        method: "POST",
        body: JSON.stringify({ type, message: message.trim(), ...(rating > 0 && { rating }) }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setMessage("");
        setRating(0);
        setType("feedback");
      }, 2000);
    } catch {
      // silent fail
    } finally {
      setSubmitting(false);
    }
  };

  const types: { value: FeedbackType; label: string; icon: typeof Bug }[] = [
    { value: "bug", label: t("feedback.typeBug"), icon: Bug },
    { value: "feedback", label: t("feedback.typeFeedback"), icon: MessageCircle },
    { value: "feature", label: t("feedback.typeFeature"), icon: Lightbulb },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-rose-600"
        aria-label={t("feedback.title")}
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">{t("feedback.title")}</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <p className="py-8 text-center text-sm font-medium text-emerald-600">
                {t("feedback.success")}
              </p>
            ) : (
              <>
                <div className="mb-4 flex gap-2">
                  {types.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        type === value
                          ? "border-rose-300 bg-rose-50 text-rose-600"
                          : "border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("feedback.messagePlaceholder")}
                  rows={4}
                  className="mb-4 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700 placeholder-stone-400 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-300"
                />

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-stone-500">
                    {t("feedback.ratingLabel")}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star === rating ? 0 : star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  className="w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                >
                  {submitting ? t("feedback.submitting") : t("feedback.submit")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
