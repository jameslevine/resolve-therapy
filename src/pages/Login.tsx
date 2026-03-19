import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as { from?: string })?.from || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === "UserNotConfirmedException") {
        navigate("/verify-email", { state: { email } });
        return;
      }
      setError(error.message || t("auth.loginFailed"));
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900">{t("auth.loginTitle")}</h1>
          <p className="mt-2 text-sm text-stone-500">{t("auth.loginSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-stone-700">
                {t("auth.password")}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-rose-500 hover:text-rose-600"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 pr-10 text-sm text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                placeholder={t("auth.passwordPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("auth.signIn")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-medium text-rose-500 hover:text-rose-600">
            {t("auth.signUpLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
