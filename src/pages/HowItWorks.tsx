import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mic, Users, Brain, MessageSquare, BarChart3, Shield, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Users,
      number: 1,
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Desc"),
      detail: t("howItWorks.step1Detail"),
    },
    {
      icon: Mic,
      number: 2,
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
      detail: t("howItWorks.step2Detail"),
    },
    {
      icon: MessageSquare,
      number: 3,
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Desc"),
      detail: t("howItWorks.step3Detail"),
    },
    {
      icon: Brain,
      number: 4,
      title: t("howItWorks.step4Title"),
      description: t("howItWorks.step4Desc"),
      detail: t("howItWorks.step4Detail"),
    },
    {
      icon: BarChart3,
      number: 5,
      title: t("howItWorks.step5Title"),
      description: t("howItWorks.step5Desc"),
      detail: t("howItWorks.step5Detail"),
    },
    {
      icon: Shield,
      number: 6,
      title: t("howItWorks.step6Title"),
      description: t("howItWorks.step6Desc"),
      detail: t("howItWorks.step6Detail"),
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("howItWorks.title")}{" "}
              <span className="text-rose-500">{t("howItWorks.titleHighlight")}</span>{" "}
              {t("howItWorks.titleEnd")}
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">{t("howItWorks.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-6 sm:gap-8">
                <div className="flex flex-col items-center">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-xl font-bold text-white shadow-lg shadow-rose-500/25">
                    {step.number}
                  </div>
                  {step.number < steps.length && <div className="mt-4 h-full w-px bg-rose-200" />}
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-3">
                    <step.icon className="h-5 w-5 text-rose-500" />
                    <h3 className="text-xl font-semibold text-stone-900">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-stone-600">
                    {step.description}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500 italic">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-rose-500 to-rose-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("howItWorks.ctaTitle")}
            </h2>
            <p className="mt-4 text-lg text-rose-100">{t("howItWorks.ctaSubtitle")}</p>
            <Link
              to="/new-session"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-rose-600 shadow-lg transition hover:bg-stone-50"
            >
              {t("common.startSession")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
