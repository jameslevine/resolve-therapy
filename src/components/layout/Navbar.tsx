import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Globe,
  User,
  LogOut,
  CreditCard,
  Plus,
  Settings,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { useAuthStore } from "@/store/auth";
import { useCreditsStore } from "@/store/credits";
import { useThemeStore } from "@/store/theme";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { balance, fetchBalance } = useCreditsStore();
  const { setTheme, isDark } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user?.sub) fetchBalance();
  }, [user?.sub, fetchBalance]);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const navLinks = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.howItWorks"), to: "/how-it-works" },
    { label: t("nav.therapists"), to: "/therapists" },
    { label: t("nav.pricing"), to: "/pricing" },
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.contact"), to: "/contact" },
  ];

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setAccountOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 dark:bg-stone-900/80 dark:border-stone-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21C12 21 3 15 3 9.5C3 7.5 4 5.5 6.25 4.75C8.5 4 10.75 5.25 11.5 6.75C11.9 7.5 12 7.75 12 7.75C12 7.75 12.1 7.5 12.5 6.75C13.25 5.25 15.5 4 17.75 4.75C20 5.5 21 7.5 21 9.5C21 15 12 21 12 21Z"
                  fill="white"
                  fillOpacity="0.95"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-stone-900 dark:text-white">
              Together<span className="text-rose-500">Therapy</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-stone-600 hover:text-rose-500 transition-colors dark:text-stone-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark() ? "light" : "dark")}
              className="rounded-full border border-stone-200 p-1.5 text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
              aria-label={isDark() ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark() ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLang.flag}</span>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                  <div className="absolute end-0 z-20 mt-2 w-48 max-h-80 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => switchLanguage(lang.code)}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-stone-50 ${
                          i18n.language === lang.code
                            ? "text-rose-500 font-medium"
                            : "text-stone-700"
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/new-session"
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("common.newSession")}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setAccountOpen(!accountOpen)}
                    className="flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                  </button>
                  {accountOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                      <div className="absolute end-0 z-20 mt-2 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                        <Link
                          to="/credits"
                          onClick={() => setAccountOpen(false)}
                          className="flex w-full items-center justify-between px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {t("credits.credits")}
                          </span>
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                            {balance}
                          </span>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setAccountOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          {t("footer.dashboard")}
                        </Link>
                        <Link
                          to="/progress"
                          onClick={() => setAccountOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <TrendingUp className="h-4 w-4" />
                          {t("progress.title")}
                        </Link>
                        <Link
                          to="/account"
                          onClick={() => setAccountOpen(false)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          {t("auth.myAccount")}
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("auth.signOut")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full border border-stone-200 px-4 py-1.5 text-sm font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-colors"
                >
                  {t("auth.signIn")}
                </Link>
                <Link
                  to="/new-session"
                  className="inline-flex items-center rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors"
                >
                  {t("common.startSession")}
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-stone-600 hover:text-rose-500 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md dark:bg-stone-900/95 dark:border-stone-700">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <>
                <Link
                  to="/new-session"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  + {t("common.newSession")}
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                >
                  {t("footer.dashboard")}
                </Link>
                <Link
                  to="/progress"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                >
                  {t("progress.title")}
                </Link>
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                >
                  {t("auth.myAccount")}
                </Link>
              </>
            )}

            {/* Mobile theme toggle */}
            <button
              onClick={() => setTheme(isDark() ? "light" : "dark")}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-stone-700 hover:bg-rose-50 hover:text-rose-500 transition-colors dark:text-stone-300"
            >
              {isDark() ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {isDark() ? t("theme.light") : t("theme.dark")}
            </button>

            {/* Mobile language switcher */}
            <div className="flex flex-wrap gap-2 px-3 py-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    switchLanguage(lang.code);
                    setMobileOpen(false);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    i18n.language === lang.code
                      ? "bg-rose-100 text-rose-600 font-medium"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>

            {user ? (
              <button
                onClick={handleSignOut}
                className="mt-2 block w-full rounded-full border border-red-200 px-5 py-2.5 text-center text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                {t("auth.signOut")}
              </button>
            ) : (
              <div className="mt-2 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-full border border-stone-200 px-5 py-2.5 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  {t("auth.signIn")}
                </Link>
                <Link
                  to="/new-session"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-full bg-rose-500 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition-colors"
                >
                  {t("common.startSession")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
