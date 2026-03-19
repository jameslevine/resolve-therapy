import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Heart,
  Brain,
  Shield,
  Users,
  Lightbulb,
  Scale,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default function About() {
  const { t } = useTranslation();

  const values = [
    { icon: Heart, title: t("about.value1Title"), description: t("about.value1Desc") },
    { icon: Brain, title: t("about.value2Title"), description: t("about.value2Desc") },
    { icon: Shield, title: t("about.value3Title"), description: t("about.value3Desc") },
    { icon: Users, title: t("about.value4Title"), description: t("about.value4Desc") },
    { icon: Lightbulb, title: t("about.value5Title"), description: t("about.value5Desc") },
    { icon: Scale, title: t("about.value6Title"), description: t("about.value6Desc") },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("about.title")} <span className="text-rose-500">{t("about.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">{t("about.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">
              {t("about.ourStoryTitle")}
            </h2>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-stone-600">
              <p>{t("about.ourStoryP1")}</p>
              <p>{t("about.ourStoryP2")}</p>
              <p>{t("about.ourStoryP3")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl">
            <img
              src="/images/site/family-together.jpg"
              alt=""
              className="h-64 w-full object-cover md:h-80"
            />
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">
              {t("about.missionTitle")}
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-stone-700">
              {t("about.missionText")}{" "}
              <span className="font-semibold text-rose-500">{t("about.missionAccessible")}</span>,{" "}
              <span className="font-semibold text-rose-500">{t("about.missionAffordable")}</span>,{" "}
              and <span className="font-semibold text-rose-500">{t("about.missionAvailable")}</span>{" "}
              {t("about.missionEnd")}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t("about.valuesTitle")}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t("about.valuesSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-8 transition hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                  <value.icon className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-stone-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900">
                  {t("about.disclaimerTitle")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-800">
                  {t("about.disclaimerText")}{" "}
                  <a
                    href="https://988lifeline.org"
                    className="font-medium underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("about.disclaimerLink")}
                  </a>{" "}
                  {t("about.disclaimerEnd")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-rose-500 to-rose-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("about.ctaTitle")}
            </h2>
            <p className="mt-4 text-lg text-rose-100">{t("about.ctaSubtitle")}</p>
            <Link
              to="/new-session"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-rose-600 shadow-lg transition hover:bg-stone-50"
            >
              {t("common.getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
