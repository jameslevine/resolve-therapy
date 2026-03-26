import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Copy, Check, Users, DollarSign, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AffiliateData {
  enrolled: boolean;
  referralCode?: string;
  totalEarnings?: number;
  pendingPayout?: number;
  totalReferrals?: number;
  referrals?: { joinedAt: string; earnings: number }[];
}

export default function AffiliatePage() {
  const { t } = useTranslation();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [payoutRequested, setPayoutRequested] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch("/checkout/affiliate");
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiFetch("/checkout/affiliate", { method: "POST" });
      await fetchData();
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  };

  const handleCopy = () => {
    if (!data?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayout = async () => {
    try {
      await apiFetch("/checkout/affiliate/payout", { method: "POST" });
      setPayoutRequested(true);
      await fetchData();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white sm:text-4xl">
          {t("affiliate.title")}{" "}
          <span className="text-rose-500">{t("affiliate.titleHighlight")}</span>
        </h1>
        <p className="mt-3 text-lg text-stone-500 dark:text-stone-400">{t("affiliate.subtitle")}</p>
      </div>

      {/* How It Works */}
      <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800">
        <h2 className="mb-4 text-lg font-semibold text-stone-800 dark:text-white">
          {t("affiliate.howItWorks")}
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                {step}
              </div>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {t(`affiliate.step${step}`)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-medium text-rose-500">{t("affiliate.commissionRate")}</p>
      </div>

      {!data?.enrolled ? (
        <div className="mt-8 text-center">
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            {enrolling ? t("common.loading") : t("common.getStarted")}
          </button>
        </div>
      ) : (
        <>
          {/* Referral Link */}
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800">
            <h2 className="mb-3 text-sm font-semibold text-stone-800 dark:text-white">
              {t("affiliate.yourLink")}
            </h2>
            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/register?ref=${data.referralCode}`}
                className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-200"
              />
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t("affiliate.copied") : t("affiliate.copyLink")}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center dark:border-stone-700 dark:bg-stone-800">
              <Users className="mx-auto h-5 w-5 text-stone-400" />
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                {data.totalReferrals}
              </p>
              <p className="mt-1 text-xs text-stone-500">{t("affiliate.totalReferrals")}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center dark:border-stone-700 dark:bg-stone-800">
              <DollarSign className="mx-auto h-5 w-5 text-stone-400" />
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                ${((data.totalEarnings || 0) / 100).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-stone-500">{t("affiliate.totalEarnings")}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center dark:border-stone-700 dark:bg-stone-800">
              <Wallet className="mx-auto h-5 w-5 text-stone-400" />
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-white">
                ${((data.pendingPayout || 0) / 100).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-stone-500">{t("affiliate.pendingPayout")}</p>
            </div>
          </div>

          {/* Payout */}
          <div className="mt-6 text-center">
            {payoutRequested ? (
              <p className="text-sm font-medium text-emerald-600">
                {t("affiliate.payoutRequested")}
              </p>
            ) : (
              <>
                <button
                  onClick={handlePayout}
                  disabled={(data.pendingPayout || 0) < 1000}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-40 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                >
                  {t("affiliate.requestPayout")}
                </button>
                <p className="mt-2 text-xs text-stone-400">{t("affiliate.payoutMinimum")}</p>
              </>
            )}
          </div>

          {/* Referral List */}
          {data.referrals && data.referrals.length > 0 && (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800">
              <h2 className="mb-4 text-sm font-semibold text-stone-800 dark:text-white">
                {t("affiliate.stats")}
              </h2>
              <div className="space-y-3">
                {data.referrals.map((ref, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3 dark:bg-stone-700"
                  >
                    <span className="text-sm text-stone-600 dark:text-stone-300">
                      {t("affiliate.joinedVia")} {new Date(ref.joinedAt).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-medium text-stone-800 dark:text-white">
                      {t("affiliate.earned")} ${(ref.earnings / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.totalReferrals === 0 && (
            <p className="mt-6 text-center text-sm text-stone-400">{t("affiliate.noReferrals")}</p>
          )}
        </>
      )}
    </div>
  );
}
