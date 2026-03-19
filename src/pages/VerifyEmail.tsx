import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Mail } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmSignUp, resendCode, loading } = useAuthStore();

  const emailFromState = (location.state as { email?: string })?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await confirmSignUp(email, code);
      navigate("/login", { state: { verified: true } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.verifyFailed"));
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendCode(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.resendFailed"));
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
            <Mail className="h-7 w-7 text-rose-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">{t("auth.verifyTitle")}</h1>
          <p className="mt-2 text-sm text-stone-500">{t("auth.verifySubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {resent && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {t("auth.codeResent")}
            </div>
          )}

          {!emailFromState && (
            <div>
              <label className="block text-sm font-medium text-stone-700">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700">
              {t("auth.verificationCode")}
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("auth.verifyButton")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            className="text-sm font-medium text-rose-500 hover:text-rose-600"
          >
            {t("auth.resendCode")}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-stone-500">
          <Link to="/login" className="font-medium text-rose-500 hover:text-rose-600">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
