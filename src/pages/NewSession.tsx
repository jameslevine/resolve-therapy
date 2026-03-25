import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Play,
  Square,
  Loader2,
  UserPlus,
  X,
  CreditCard,
  Mic,
} from "lucide-react";
import { THERAPIST_PROFILES } from "@/lib/therapists-data";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useCreditsStore } from "@/store/credits";
import type { TherapistProfile } from "@/types";

const RELATIONSHIP_KEYS = [
  "romantic",
  "married",
  "family",
  "friends",
  "housemates",
  "colleagues",
  "other",
] as const;

const STEPS = ["therapist", "participants", "focus", "review"] as const;
type Step = (typeof STEPS)[number];

export default function NewSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { balance } = useCreditsStore();

  // Wizard state
  const [step, setStep] = useState<Step>("therapist");
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistProfile | null>(null);
  const [nameInputs, setNameInputs] = useState<string[]>(["", ""]);
  const [relationship, setRelationship] = useState("");
  const [prompt, setPrompt] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice preview
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  };

  const goBack = () => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case "therapist":
        return selectedTherapist !== null;
      case "participants":
        return nameInputs.some((n) => n.trim().length > 0);
      case "focus":
        return true;
      case "review":
        return balance >= 1;
      default:
        return false;
    }
  };

  const handlePreviewVoice = useCallback(
    (therapist: TherapistProfile) => {
      if (previewingVoice === therapist.id) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPreviewingVoice(null);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPreviewingVoice(therapist.id);
      const audio = new Audio(`/audio/therapists/${therapist.id}.mp3`);
      audioRef.current = audio;
      audio.onended = () => {
        audioRef.current = null;
        setPreviewingVoice(null);
      };
      audio.onerror = () => {
        audioRef.current = null;
        setPreviewingVoice(null);
      };
      audio.play();
    },
    [previewingVoice],
  );

  const handleStartSession = async () => {
    if (!user?.sub || !selectedTherapist) return;
    setLoading(true);
    setError(null);

    const participants = {
      names: nameInputs.map((n) => n.trim()).filter(Boolean),
      relationship,
      context: contextNote.trim(),
    };

    try {
      const res = await apiFetch("/sessions/start", {
        method: "POST",
        body: JSON.stringify({
          therapistId: selectedTherapist.id,
          prompt,
          participants,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          navigate("/credits");
          return;
        }
        throw new Error(data.error || "Failed to start session");
      }
      navigate(`/session/${data.sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("wizard.startError"));
      setLoading(false);
    }
  };

  // --- Step renderers ---

  const renderTherapistStep = () => (
    <div>
      <h2 className="text-2xl font-bold text-stone-900">{t("wizard.chooseTherapist")}</h2>
      <p className="mt-2 text-stone-500">{t("wizard.chooseTherapistDesc")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THERAPIST_PROFILES.map((tp) => {
          const isSelected = selectedTherapist?.id === tp.id;
          return (
            <button
              key={tp.id}
              type="button"
              onClick={() => setSelectedTherapist(tp)}
              className={`group relative cursor-pointer rounded-2xl border-2 p-5 text-left transition-all hover:shadow-lg ${
                isSelected
                  ? "border-rose-500 bg-rose-50/50 shadow-md shadow-rose-500/10"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 end-3 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <img
                  src={tp.imageUrl}
                  alt={tp.name}
                  className={`h-14 w-14 flex-shrink-0 rounded-full object-cover ring-2 ${
                    isSelected ? "ring-rose-400" : "ring-stone-200"
                  }`}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{tp.name}</p>
                  <p className="text-xs text-stone-500 truncate">{tp.title}</p>
                </div>
              </div>

              <p className="mt-3 text-xs font-medium text-rose-500">{tp.specialty}</p>
              <p className="mt-2 text-sm text-stone-600 line-clamp-3">{tp.bio.slice(0, 120)}...</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(tp);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    previewingVoice === tp.id
                      ? "bg-rose-100 text-rose-600"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {previewingVoice === tp.id ? (
                    <>
                      <Square className="h-3 w-3" /> {t("wizard.stopPreview")}
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3" /> {t("wizard.previewVoice")}
                    </>
                  )}
                </button>
                {tp.voiceTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-stone-50 px-2 py-1 text-[10px] font-medium text-stone-400 ring-1 ring-stone-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderParticipantsStep = () => {
    const addNameField = () => setNameInputs((prev) => [...prev, ""]);
    const removeNameField = (i: number) =>
      setNameInputs((prev) => prev.filter((_, idx) => idx !== i));
    const updateName = (i: number, val: string) =>
      setNameInputs((prev) => prev.map((n, idx) => (idx === i ? val : n)));

    return (
      <div className="mx-auto max-w-lg">
        <h2 className="text-2xl font-bold text-stone-900">{t("wizard.whoIsJoining")}</h2>
        <p className="mt-2 text-stone-500">{t("wizard.whoIsJoiningDesc")}</p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              {t("session.whoParticipating")}
            </label>
            <div className="mt-2 space-y-2">
              {nameInputs.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateName(i, e.target.value)}
                    placeholder={t("session.personPlaceholder", { num: i + 1 })}
                    className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  {nameInputs.length > 2 && (
                    <button
                      onClick={() => removeNameField(i)}
                      className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {nameInputs.length < 6 && (
              <button
                onClick={addNameField}
                className="mt-2 flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-600"
              >
                <UserPlus className="h-4 w-4" /> {t("session.addPerson")}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">
              {t("session.relationship")}
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">{t("session.selectRelationship")}</option>
              {RELATIONSHIP_KEYS.map((key) => (
                <option key={key} value={t(`session.relationshipOptions.${key}`)}>
                  {t(`session.relationshipOptions.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderFocusStep = () => (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-bold text-stone-900">{t("wizard.sessionFocus")}</h2>
      <p className="mt-2 text-stone-500">{t("wizard.sessionFocusDesc")}</p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-700">
            {t("wizard.whatToWorkOn")}{" "}
            <span className="font-normal text-stone-400">({t("session.optional")})</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder={t("wizard.focusPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            {t("session.anythingElse")}{" "}
            <span className="font-normal text-stone-400">({t("session.optional")})</span>
          </label>
          <textarea
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            placeholder={t("session.contextPlaceholder")}
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const participantNames = nameInputs.map((n) => n.trim()).filter(Boolean);

    return (
      <div className="mx-auto max-w-lg">
        <h2 className="text-2xl font-bold text-stone-900">{t("wizard.reviewTitle")}</h2>
        <p className="mt-2 text-stone-500">{t("wizard.reviewDesc")}</p>

        <div className="mt-8 space-y-4">
          {/* Therapist */}
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
              {t("wizard.yourTherapist")}
            </p>
            {selectedTherapist && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={selectedTherapist.imageUrl}
                  alt={selectedTherapist.name}
                  className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-2 ring-rose-200"
                />
                <div>
                  <p className="font-semibold text-stone-900">{selectedTherapist.name}</p>
                  <p className="text-xs text-stone-500">{selectedTherapist.specialty}</p>
                </div>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
              {t("wizard.participants")}
            </p>
            <p className="mt-1 font-medium text-stone-900">
              {participantNames.length > 0
                ? participantNames.join(", ")
                : t("wizard.noParticipants")}
            </p>
            {relationship && <p className="text-sm text-stone-500">{relationship}</p>}
          </div>

          {/* Focus */}
          {prompt && (
            <div className="rounded-xl border border-stone-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                {t("wizard.focus")}
              </p>
              <p className="mt-1 text-sm text-stone-700">{prompt}</p>
            </div>
          )}

          {/* Cost */}
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium text-stone-700">{t("credits.cost")}</span>
              </div>
              <div className="text-end">
                <span className="text-lg font-bold text-rose-600">1 {t("credits.credit")}</span>
                <p className="text-xs text-stone-500">
                  {t("credits.balanceLabel")}: {balance}
                </p>
              </div>
            </div>
          </div>

          {balance < 1 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-sm font-medium text-amber-800">{t("wizard.noCredits")}</p>
              <button
                onClick={() => navigate("/credits")}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-rose-500 hover:text-rose-600"
              >
                {t("credits.buyCredits")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case "therapist":
        return renderTherapistStep();
      case "participants":
        return renderParticipantsStep();
      case "focus":
        return renderFocusStep();
      case "review":
        return renderReviewStep();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Progress bar */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                    i < currentStepIndex
                      ? "bg-rose-500 text-white"
                      : i === currentStepIndex
                        ? "bg-rose-500 text-white ring-4 ring-rose-100"
                        : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`ms-2 hidden text-sm font-medium sm:block ${
                    i <= currentStepIndex ? "text-stone-900" : "text-stone-400"
                  }`}
                >
                  {t(`wizard.step${i + 1}`)}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-3 h-px w-8 sm:w-16 ${i < currentStepIndex ? "bg-rose-500" : "bg-stone-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {renderStep()}

        {error && (
          <div className="mx-auto mt-6 max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mx-auto mt-10 flex max-w-lg items-center justify-between">
          <button
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-100 disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </button>

          {step === "review" ? (
            <button
              onClick={handleStartSession}
              disabled={loading || balance < 1}
              className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              {t("wizard.startSession")}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50"
            >
              {t("common.continue")} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
