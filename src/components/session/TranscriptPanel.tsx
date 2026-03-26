import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TranscriptEntry } from "@/types";

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
  therapistName: string;
}

export default function TranscriptPanel({ transcript, therapistName }: TranscriptPanelProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-sm text-stone-400">{t("session.transcriptPlaceholder")}</p>
      </div>
    );
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto px-4 py-4">
      <div className="mx-auto max-w-2xl space-y-4">
        {transcript.map((entry) => (
          <div
            key={entry.id}
            className={`flex gap-3 ${entry.isTherapist ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                entry.isTherapist ? "bg-rose-500" : "bg-blue-500"
              }`}
            >
              {entry.isTherapist ? getInitials(therapistName) : t("session.you")}
            </div>

            <div className={`max-w-[75%] ${entry.isTherapist ? "items-end" : "items-start"}`}>
              <div
                className={`flex items-baseline gap-2 ${entry.isTherapist ? "flex-row-reverse" : "flex-row"}`}
              >
                <span className="text-xs font-medium text-stone-600">
                  {entry.isTherapist ? therapistName : t("session.you")}
                </span>
                <span className="text-[10px] text-stone-400">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>

              <div
                className={`mt-1 rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  entry.isTherapist
                    ? "rounded-tr-sm bg-rose-500 text-white"
                    : "rounded-tl-sm border border-stone-200 bg-white text-stone-700"
                }`}
              >
                {entry.content}
              </div>
            </div>
          </div>
        ))}
        <div />
      </div>
    </div>
  );
}
