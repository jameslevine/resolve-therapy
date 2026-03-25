import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Check, CreditCard, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useCreditsStore } from "@/store/credits";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/currency";

const PACKAGES = [
  { id: "1", hours: 1, minutes: 60, price: 29, popular: false },
  { id: "3", hours: 3, minutes: 180, price: 69, popular: true },
  { id: "10", hours: 10, minutes: 600, price: 179, popular: false },
];

export default function Credits() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const { balance, fetchBalance } = useCreditsStore();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.sub) fetchBalance();
  }, [user?.sub, fetchBalance]);

  useEffect(() => {
    if (searchParams.get("purchase") === "success") {
      setPurchaseSuccess(true);
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        apiFetch(`/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.balance !== undefined) {
              fetchBalance();
            }
          })
          .catch(() => {
            fetchBalance();
          });
      } else if (user?.sub) {
        setTimeout(() => fetchBalance(), 2000);
      }
    }
  }, [searchParams, user?.sub, fetchBalance]);

  const handlePurchase = async (pkgId: string) => {
    if (!user?.sub) return;
    setError(null);
    setLoadingPkg(pkgId);
    try {
      const res = await apiFetch("/checkout/credits", {
        method: "POST",
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t("credits.purchaseError"));
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError(t("credits.purchaseError"));
    } finally {
      setLoadingPkg(null);
    }
  };

  const perMinute = (price: number, minutes: number) => (price / minutes).toFixed(2);

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("credits.title")}{" "}
              <span className="text-rose-500">{t("credits.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">{t("credits.subtitle")}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 shadow-sm border border-stone-200">
              <CreditCard className="h-5 w-5 text-rose-500" />
              <span className="text-sm font-medium text-stone-700">
                {t("credits.currentBalance")}:
              </span>
              <span className="text-lg font-bold text-rose-600">{balance}</span>
              <span className="text-sm text-stone-500">{t("credits.minutes")}</span>
            </div>
          </div>
        </div>
      </section>

      {purchaseSuccess && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mb-8 pt-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center">
            <p className="font-medium text-emerald-800">{t("credits.purchaseSuccess")}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mb-8 pt-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center">
            <p className="font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative overflow-hidden rounded-3xl border-2 bg-white shadow-lg transition hover:shadow-xl ${
                  pkg.popular ? "border-rose-500 shadow-rose-500/10" : "border-stone-200"
                }`}
              >
                {pkg.popular && (
                  <div className="flex items-center justify-center gap-1 bg-rose-500 py-2 text-xs font-semibold uppercase tracking-wider text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("credits.mostPopular")}
                  </div>
                )}
                <div className="p-8">
                  <p className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                    {pkg.hours} {pkg.hours === 1 ? t("credits.hour") : t("credits.hours")}
                  </p>
                  <p className="text-xs text-stone-400">
                    {pkg.minutes} {t("credits.minutes")}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-stone-900">
                      {formatPrice(pkg.price)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatPrice(Number(perMinute(pkg.price, pkg.minutes)))}{" "}
                    {t("credits.perMinute")}
                  </p>

                  {pkg.hours > 1 && (
                    <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-1.5 text-center text-xs font-medium text-emerald-700">
                      {t("credits.save")}{" "}
                      {Math.round((1 - pkg.price / pkg.minutes / (29 / 60)) * 100)}%
                    </div>
                  )}

                  <ul className="mt-6 space-y-3">
                    {[t("credits.feature1"), t("credits.feature2"), t("credits.feature3")].map(
                      (f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ),
                    )}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loadingPkg !== null}
                    className={`mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      pkg.popular
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600"
                        : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {loadingPkg === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t("credits.buyNow")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
