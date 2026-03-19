import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Play, Square } from "lucide-react";
import type { TherapistProfile } from "../../types";

interface TherapistCardProps {
  therapist: TherapistProfile;
}

export default function TherapistCard({ therapist }: TherapistCardProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

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
    },
    [playing, therapist.id],
  );

  return (
    <div className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:shadow-lg">
      <div className="h-48 overflow-hidden bg-gradient-to-br from-rose-100 to-rose-200">
        {therapist.imageUrl ? (
          <img
            src={therapist.imageUrl}
            alt={therapist.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
      <div className="p-6">
        <h3 className="text-lg font-semibold text-stone-900">{therapist.name}</h3>
        <p className="mt-0.5 text-sm text-rose-500">{therapist.title}</p>
        <p className="mt-1 text-xs font-medium text-stone-500">{therapist.specialty}</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-600 line-clamp-3">{therapist.bio}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={handlePreview}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              playing
                ? "bg-rose-100 text-rose-600"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {playing ? (
              <>
                <Square className="h-3 w-3" /> {t("wizard.stopPreview")}
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> {t("wizard.previewVoice")}
              </>
            )}
          </button>
          {therapist.voiceTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-stone-50 px-2 py-1 text-[10px] font-medium text-stone-400 ring-1 ring-stone-200"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          to={`/therapists/${therapist.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 transition hover:text-rose-600"
        >
          {t("therapists.viewProfile")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
