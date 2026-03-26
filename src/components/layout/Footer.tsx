import { Link } from "react-router-dom";

import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  const platformLinks = [
    { label: t("nav.howItWorks"), to: "/how-it-works" },
    { label: t("nav.therapists"), to: "/therapists" },
    { label: t("nav.pricing"), to: "/pricing" },
    { label: t("footer.dashboard"), to: "/dashboard" },
    { label: t("affiliate.navLabel"), to: "/affiliate" },
  ];

  const companyLinks = [
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.contact"), to: "/contact" },
    { label: t("footer.privacyPolicy"), to: "/privacy" },
    { label: t("footer.termsOfService"), to: "/terms" },
  ];

  const supportLinks = [
    { label: t("footer.faq"), to: "/faq" },
    { label: t("footer.helpCenter"), to: "/help" },
    { label: t("footer.getInTouch"), to: "/contact" },
  ];

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
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
              <span className="text-xl font-bold text-white">
                Together<span className="text-rose-500">Therapy</span>
              </span>
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-400">
                {t("beta.tag")}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">{t("footer.tagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.platform")}
            </h3>
            <ul className="mt-4 space-y-3">
              {platformLinks.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-stone-400 hover:text-rose-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.company")}
            </h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-stone-400 hover:text-rose-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.support")}
            </h3>
            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <li key={link.to + link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-stone-400 hover:text-rose-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-stone-800 pt-8">
          <p className="text-center text-xs text-stone-500">
            &copy; {new Date().getFullYear()} {t("common.copyright")}
          </p>
          <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">
            {t("common.disclaimer")}{" "}
            <a href="tel:988" className="text-rose-400 underline hover:text-rose-300">
              {t("common.crisisLifeline")}
            </a>{" "}
            {t("common.forImmediateSupport")}
          </p>
        </div>
      </div>
    </footer>
  );
}
