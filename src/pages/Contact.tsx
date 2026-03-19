import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("contact.title")}{" "}
              <span className="text-rose-500">{t("contact.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">{t("contact.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="grid gap-12 md:grid-cols-5">
              <div className="md:col-span-2 space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                    <Mail className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{t("contact.email")}</h3>
                    <p className="mt-1 text-sm text-stone-600">support@togethertherapy.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                    <MessageSquare className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{t("contact.responseTime")}</h3>
                    <p className="mt-1 text-sm text-stone-600">{t("contact.responseTimeValue")}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3">
                {submitted ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <Send className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-emerald-900">
                      {t("contact.sentTitle")}
                    </h3>
                    <p className="mt-2 text-sm text-emerald-700">{t("contact.sentMessage")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        {t("contact.nameLabel")}
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        placeholder={t("contact.namePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        {t("contact.emailLabel")}
                      </label>
                      <input
                        type="email"
                        required
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        placeholder={t("contact.emailPlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        {t("contact.messageLabel")}
                      </label>
                      <textarea
                        rows={5}
                        required
                        className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        placeholder={t("contact.messagePlaceholder")}
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
                    >
                      {t("common.send")}
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
