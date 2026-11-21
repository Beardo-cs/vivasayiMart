import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ta from './ta.json';

let saved = 'en';
try {
  saved = localStorage.getItem('lang') || 'en';
} catch (e) { /* storage blocked: default to English */ }

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta } },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false } // React already escapes
});

document.documentElement.lang = i18n.language;

export const setLanguage = lang => {
  i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
};

export default i18n;

// Translate a message that came from the server (it always sends English).
// Exact matches live in the `serverMsgs` section of the language files; a few messages
// that embed names/numbers are matched by pattern. Unknown messages are shown as sent.
const PATTERNS = [
  [/^Only (.+) of (.+) available$/, 'onlyAvailable', ['stock', 'name']],
  [/^(.+) is sold out or unavailable$/, 'soldOutNamed', ['name']]
];

export const tServer = msg => {
  if (typeof msg !== 'string') return msg;
  const map = i18n.getResource(i18n.language, 'translation', 'serverMsgs') || {};
  if (map[msg]) return map[msg];
  for (const [re, key, names] of PATTERNS) {
    const m = msg.match(re);
    if (m && map[key]) {
      return names.reduce((out, n, i) => out.replace(`{{${n}}}`, m[i + 1]), map[key]);
    }
  }
  return msg;
};
