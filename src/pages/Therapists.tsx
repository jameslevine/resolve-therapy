import { useTranslation } from "react-i18next";
import { THERAPIST_PROFILES } from "../lib/therapists-data";
import TherapistCard from "../components/therapist/TherapistCard";

export default function Therapists() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-rose-50 via-white to-stone-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
              {t("therapists.title")}{" "}
              <span className="text-rose-500">{t("therapists.titleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-stone-600">{t("therapists.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {THERAPIST_PROFILES.map((therapist) => (
              <TherapistCard key={therapist.id} therapist={therapist} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
