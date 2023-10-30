import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../constants/languages';

export function detectUserLanguage() {
  const userLang = localStorage.getItem('language') || navigator.language;
  if (userLang) {
    const lang = SUPPORTED_LANGUAGES.find(
      lang =>
        lang.code.toLowerCase() === userLang.toLowerCase() ||
        lang.altCodes.map(l => l.toLowerCase()).includes(userLang.toLowerCase())
    );
    if (lang) {
      return lang.code;
    }
  }
  return DEFAULT_LANGUAGE;
}
