import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BetaBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("betaDismissed") === "1");

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("betaDismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="relative bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-center text-sm text-white">
      <span>{t("beta.banner")}</span>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white transition-colors"
        aria-label={t("beta.dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
