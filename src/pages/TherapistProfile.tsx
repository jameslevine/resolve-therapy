import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Play, Square } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { THERAPIST_PROFILES } from "../lib/therapists-data";
import BookingModal from "../components/therapist/BookingModal";

export default function TherapistProfile() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [showBooking, setShowBooking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const therapist = THERAPIST_PROFILES.find((tp) => tp.id === id);

  const handlePreview = useCallback(() => {
    if (!therapist) return;

    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    const audio = new Audio(`/audio/therapists/${therapist.id}.mp3`);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => {
      audioRef.current = null;
      setPlaying(false);
    };
    audio.onerror = () => {
      audioRef.current = null;
      setPlaying(false);
    };
    audio.play();
  }, [playing, therapist]);

  if (!therapist) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg text-stone-500">{t("therapists.notFound")}</p>
        <Link
          to="/therapists"
          className="inline-flex items-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-600"
        >
          <ArrowLeft className="h-4 w-4" /> {t("therapists.backToTherapists")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          to="/therapists"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-rose-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t("therapists.allTherapists")}
        </Link>
      </div>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="h-48 w-48 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 shadow-lg">
              {therapist.imageUrl ? (
                <img
                  src={therapist.imageUrl}
                  alt={therapist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-rose-400">
                  {therapist.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-stone-900">{therapist.name}</h1>
              <p className="mt-1 text-lg text-rose-500">{therapist.title}</p>
              <p className="mt-1 text-sm font-medium text-stone-500">{therapist.specialty}</p>

              {/* Voice preview + tags */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <button
                  onClick={handlePreview}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                    playing
                      ? "bg-rose-100 text-rose-600"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {playing ? (
                    <>
                      <Square className="h-3.5 w-3.5" /> {t("wizard.stopPreview")}
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> {t("wizard.previewVoice")}
                    </>
                  )}
                </button>
                {therapist.voiceTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-400 ring-1 ring-stone-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowBooking(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600"
                >
                  <Play className="h-4 w-4" /> {t("therapists.bookSession")} — {formatPrice()}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">{t("therapists.about")}</h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600">{therapist.bio}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-900">
                {t("therapists.backgroundTitle")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                {therapist.background}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-900">
                {t("therapists.approachTitle")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-600 italic">
                "{therapist.approach}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {showBooking && <BookingModal therapist={therapist} onClose={() => setShowBooking(false)} />}
    </div>
  );
}
