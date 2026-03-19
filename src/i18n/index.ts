import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import es from "./es.json";
import ar from "./ar.json";
import fr from "./fr.json";
import de from "./de.json";
import pt from "./pt.json";
import zh from "./zh.json";
import ja from "./ja.json";
import ko from "./ko.json";
import hi from "./hi.json";
import it from "./it.json";
import ru from "./ru.json";
import tr from "./tr.json";
import nl from "./nl.json";
import pl from "./pl.json";
import th from "./th.json";
import vi from "./vi.json";
import id from "./id.json";
import uk from "./uk.json";
import sv from "./sv.json";
import he from "./he.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  ar: { translation: ar },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  hi: { translation: hi },
  it: { translation: it },
  ru: { translation: ru },
  tr: { translation: tr },
  nl: { translation: nl },
  pl: { translation: pl },
  th: { translation: th },
  vi: { translation: vi },
  id: { translation: id },
  uk: { translation: uk },
  sv: { translation: sv },
  he: { translation: he },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export const RTL_LANGUAGES = ["ar", "he"];

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
];

export default i18n;
