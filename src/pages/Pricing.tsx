import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@/lib/currency";
import { Check, ArrowRight, HelpCircle } from "lucide-react";

export default function Pricing() {
  const { t } = useTranslation();

  const included = [
    t("pricing.included1"),
    t("pricing.included2"),
    t("pricing.included3"),
    t("pricing.included4"),
    t("pricing.included5"),
    t("pricing.included6"),
  ];

  const faqs = [
    { q: t("pricing.faq1Q"), a: t("pricing.faq1A") },
    { q: t("pricing.faq2Q"), a: t("pricing.faq2A") },
    { q: t("pricing.faq3Q"), a: t("pricing.faq3A") },
    { q: t("pricing.faq4Q"), a: t("pricing.faq4A") },
    { q: t("pricing.faq5Q"), a: t("pricing.faq5A") },
    { q: t("pricing.faq6Q"), a: t("pricing.faq6A") },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("pricing.title")}{" "}
              <span className="text-rose-500">{t("pricing.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">{t("pricing.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <div className="overflow-hidden rounded-3xl border-2 border-rose-200 bg-white shadow-xl shadow-rose-500/10">
              <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-8 py-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-rose-100">
                  {t("pricing.perSession")}
                </p>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-white">{formatPrice()}</span>
                </div>
                <p className="mt-2 text-sm text-rose-100">{t("pricing.oneTimePayment")}</p>
              </div>
              <div className="px-8 py-8">
                <ul className="space-y-4">
                  {included.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                      <span className="text-sm text-stone-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/new-session"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
                >
                  {t("common.startSession")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-rose-500" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t("pricing.faqTitle")}
            </h2>
          </div>
          <div className="mx-auto mt-16 max-w-3xl space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-stone-200 bg-white p-6">
                <h3 className="text-base font-semibold text-stone-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
