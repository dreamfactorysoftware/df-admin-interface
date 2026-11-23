/**
 * Test helper: a Translate backed by the real English bundle, so the helper
 * specs keep asserting the sentences an admin reads. Throws on a missing key,
 * which catches a typo in a key name.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const en = require('../../../assets/i18n/services/en.json');

export function enT(key: string, params: Record<string, unknown> = {}): string {
  const value = key
    .split('.')
    .reduce<any>((node, part) => node?.[part], en.semantic);
  if (typeof value !== 'string') {
    throw new Error(`missing i18n key services.semantic.${key}`);
  }
  return value.replace(/{{\s*(\w+)\s*}}/g, (_, name) => String(params[name]));
}

/** TranslocoTestingModule options with the real services bundle preloaded. */
export const translocoEn = {
  langs: { en: { services: en } },
  translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
  preloadLangs: true,
};
