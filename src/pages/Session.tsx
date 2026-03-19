import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { THERAPIST_PROFILES } from "@/lib/therapists-data";
import type { TherapistProfile } from "@/types";
import SessionInterface from "@/components/session/SessionInterface";

interface SessionData {
  id: string;
  therapistId: string;
  prompt: string;
  status: string;
  participants?: {
    names: string[];
    relationship: string;
    context: string;
  } | null;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [session, setSession] = useState<SessionData | null>(null);
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify payment on mount if redirected from Stripe
  useEffect(() => {
    if (!id) return;

    const verifyPayment = async () => {
      if (searchParams.get("payment") === "success") {
        try {
          await apiFetch(`/sessions/${id}/verify-payment`, {
            method: "POST",
          });
          // Remove payment param from URL after verification
          searchParams.delete("payment");
          setSearchParams(searchParams, { replace: true });
        } catch (err) {
          console.error("Payment verification failed:", err);
        }
      }
    };

    verifyPayment();
  }, [id, searchParams, setSearchParams]);

  // Fetch session data
  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiFetch(`/sessions/${id}`);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Session not found. Please check your link and try again."
              : "Failed to load session. Please try again later.",
          );
        }

        const data: SessionData = await res.json();
        setSession(data);

        const matched = THERAPIST_PROFILES.find((t) => t.id === data.therapistId);
        if (!matched) {
          throw new Error("Therapist profile not found for this session.");
        }
        setTherapist(matched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
        <p className="text-lg text-stone-500">Preparing your session...</p>
      </div>
    );
  }

  if (error || !session || !therapist || !id) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error || "Something went wrong loading this session."}</p>
        </div>
      </div>
    );
  }

  return (
    <SessionInterface
      sessionId={id}
      therapist={therapist}
      sessionPrompt={session.prompt}
      sessionParticipants={session.participants}
    />
  );
}
