import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Brain,
  Volume2,
  Timer,
  Sparkles,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  CreditCard,
  HeartHandshake,
  Baby,
  Home as HomeIcon,
  MessageCircle,
  Wallet,
  Heart,
  Users,
} from "lucide-react";

export default function Home() {
  const { t } = useTranslation();

  const features = [
    { icon: Clock, title: t("home.feature1Title"), description: t("home.feature1Desc") },
    { icon: Brain, title: t("home.feature2Title"), description: t("home.feature2Desc") },
    { icon: Volume2, title: t("home.feature3Title"), description: t("home.feature3Desc") },
    { icon: Timer, title: t("home.feature4Title"), description: t("home.feature4Desc") },
    { icon: Sparkles, title: t("home.feature5Title"), description: t("home.feature5Desc") },
    { icon: Shield, title: t("home.feature6Title"), description: t("home.feature6Desc") },
  ];

  const useCases = [
    { icon: Baby, title: t("home.useCase1Title"), description: t("home.useCase1Desc") },
    { icon: Wallet, title: t("home.useCase2Title"), description: t("home.useCase2Desc") },
    { icon: MessageCircle, title: t("home.useCase3Title"), description: t("home.useCase3Desc") },
    { icon: HomeIcon, title: t("home.useCase4Title"), description: t("home.useCase4Desc") },
    { icon: Heart, title: t("home.useCase5Title"), description: t("home.useCase5Desc") },
    { icon: Users, title: t("home.useCase6Title"), description: t("home.useCase6Desc") },
  ];

  const steps = [
    { number: 1, title: t("home.step1Title"), description: t("home.step1Desc") },
    { number: 2, title: t("home.step2Title"), description: t("home.step2Desc") },
    { number: 3, title: t("home.step3Title"), description: t("home.step3Desc") },
    { number: 4, title: t("home.step4Title"), description: t("home.step4Desc") },
  ];

  const testimonials = [
    {
      name: t("home.testimonial1Name"),
      role: t("home.testimonial1Role"),
      quote: t("home.testimonial1Quote"),
      rating: 5,
    },
    {
      name: t("home.testimonial2Name"),
      role: t("home.testimonial2Role"),
      quote: t("home.testimonial2Quote"),
      rating: 5,
    },
    {
      name: t("home.testimonial3Name"),
      role: t("home.testimonial3Role"),
      quote: t("home.testimonial3Quote"),
      rating: 4,
    },
    {
      name: t("home.testimonial4Name"),
      role: t("home.testimonial4Role"),
      quote: t("home.testimonial4Quote"),
      rating: 5,
    },
    {
      name: t("home.testimonial5Name"),
      role: t("home.testimonial5Role"),
      quote: t("home.testimonial5Quote"),
      rating: 5,
    },
    {
      name: t("home.testimonial6Name"),
      role: t("home.testimonial6Role"),
      quote: t("home.testimonial6Quote"),
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24 md:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                {t("home.heroTitle")}{" "}
                <span className="text-rose-500">{t("home.heroHighlight")}</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-stone-600">{t("home.heroSubtitle")}</p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  to="/therapists"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
                >
                  {t("common.meetTherapists")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-8 py-3.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
                >
                  {t("home.howItWorks")}
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
                  <CheckCircle className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium text-stone-700">
                    {t("common.noSubscription")}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
                  <CreditCard className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium text-stone-700">
                    {t("home.payByMinute")}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-stone-200">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium text-stone-700">
                    {t("common.available247")}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/site/hero-couple.jpg"
                alt=""
                className="rounded-3xl shadow-2xl shadow-rose-500/10 object-cover w-full max-h-[480px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-stone-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">125,000+</p>
              <p className="mt-1 text-sm text-stone-400">{t("home.sessionsCompleted")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">4.9/5</p>
              <p className="mt-1 text-sm text-stone-400">{t("home.averageRating")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">94%</p>
              <p className="mt-1 text-sm text-stone-400">{t("home.reportImprovement")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">25+</p>
              <p className="mt-1 text-sm text-stone-400">{t("home.aiTherapists")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t("home.featuresTitle")}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t("home.featuresSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-8 transition hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                  <f.icon className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t("home.howItWorksTitle")}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t("home.howItWorksSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-xl font-bold text-white shadow-lg shadow-rose-500/25">
                  {step.number}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Couple Image Banner */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl">
            <img
              src="/images/site/couple-talking.jpg"
              alt=""
              className="h-64 w-full object-cover md:h-80"
            />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t("home.useCasesTitle")}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t("home.useCasesSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-6 transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                  <uc.icon className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">{uc.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{uc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t("home.testimonialsTitle")}
            </h2>
            <p className="mt-4 text-lg text-stone-600">{t("home.testimonialsSubtitle")}</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm"
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < testimonial.rating ? "fill-rose-500 text-rose-500" : "fill-stone-200 text-stone-200"}`}
                    />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-stone-700">
                  "{testimonial.quote}"
                </blockquote>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-stone-900">{testimonial.name}</p>
                  <p className="text-xs text-stone-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Couple Relief Image */}
      <section className="bg-stone-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="overflow-hidden rounded-3xl">
              <img
                src="/images/site/couple-relief.jpg"
                alt=""
                className="h-72 w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-3xl">
              <img
                src="/images/site/couple-walking.jpg"
                alt=""
                className="h-72 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-rose-500 to-rose-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <HeartHandshake className="mx-auto h-12 w-12 text-white/80" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("home.ctaTitle")}
            </h2>
            <p className="mt-4 text-lg text-rose-100">{t("home.ctaSubtitle")}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/new-session"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-rose-600 shadow-lg transition hover:bg-stone-50"
              >
                {t("common.startSession")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("home.contactUs")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
