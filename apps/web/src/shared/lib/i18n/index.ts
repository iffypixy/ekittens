import * as i18n from "i18next";
import {initReactI18next} from "react-i18next";
import detector from "i18next-browser-languagedetector";
import backend from "i18next-http-backend";

export const langs = ["en", "es", "de", "fr"];

i18n
  .use(detector)
  .use(backend)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.VITE_ENV === "development",
    fallbackLng: "en",
    interpolation: {escapeValue: false},
    cleanCode: true,
    backend: {
      loadPath: "/public/locales/{{ns}}/{{lng}}.json",
    },
    ns: ["home", "common"],
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
    },
  });

export {i18n};
