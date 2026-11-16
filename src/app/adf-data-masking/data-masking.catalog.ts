/**
 * Data Masking catalog: the fixed class ids, their tiers, mask formats and a
 * synthetic sample per class. Pure TypeScript with no Angular imports so the
 * Playwright mock and the fixture generator can share it with the UI.
 *
 * Labels live in i18n (dataMasking/en.json, keys `classes.<id>`,
 * `tiers.<id>`, `formats.<id>`); this file only holds ids and behavior.
 */

export type Tier = 'restricted' | 'identity' | 'quasi' | 'free_text';

export type MaskFormat =
  | 'redact'
  | 'last4'
  | 'initial'
  | 'year'
  | 'token'
  | 'null'
  | 'span';

export interface ClassDef {
  id: string;
  tier: Tier;
  /** Format applied when an admin has not chosen one. */
  format: MaskFormat;
  /** Formats offered on the Masks tab. Restricted never offers token. */
  formats: MaskFormat[];
  /** Synthetic, obviously fake sample for the Masks tab before -> after. */
  sample: string;
  /** Prefix for stable typed tokens (EMAIL_7f3a). */
  token: string;
}

export const TIERS: Tier[] = ['restricted', 'identity', 'quasi', 'free_text'];

export const CLASSES: ClassDef[] = [
  // restricted
  {
    id: 'national_id',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'last4', 'null'],
    sample: '123-45-6789',
    token: 'NID',
  },
  {
    id: 'tax_id',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'last4', 'null'],
    sample: '12-3456789',
    token: 'TAX',
  },
  {
    id: 'passport_number',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'last4', 'null'],
    sample: 'X12345678',
    token: 'PASS',
  },
  {
    id: 'drivers_license',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'last4', 'null'],
    sample: 'D123-4567-8901',
    token: 'DL',
  },
  {
    id: 'card_number',
    tier: 'restricted',
    format: 'last4',
    formats: ['last4', 'redact', 'null'],
    sample: '4111 1111 1111 1234',
    token: 'CARD',
  },
  {
    id: 'card_security',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'null'],
    sample: '123',
    token: 'CVV',
  },
  {
    id: 'bank_account',
    tier: 'restricted',
    format: 'last4',
    formats: ['last4', 'redact', 'null'],
    sample: 'NL91 ABNA 0417 1643 00',
    token: 'BANK',
  },
  {
    id: 'credential',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'null'],
    sample: 'sk_live_4eC39HqLyjWDarjtT1',
    token: 'CRED',
  },
  {
    id: 'special_category',
    tier: 'restricted',
    format: 'redact',
    formats: ['redact', 'null'],
    sample: 'Type 2 diabetes',
    token: 'HEALTH',
  },
  // identity
  {
    id: 'email',
    tier: 'identity',
    format: 'token',
    formats: ['token', 'initial', 'redact', 'null'],
    sample: 'jane.doe@example.com',
    token: 'EMAIL',
  },
  {
    id: 'phone',
    tier: 'identity',
    format: 'token',
    formats: ['token', 'last4', 'redact', 'null'],
    sample: '+1 415-555-0132',
    token: 'PHONE',
  },
  {
    id: 'person_name',
    tier: 'identity',
    format: 'token',
    formats: ['token', 'initial', 'redact', 'null'],
    sample: 'Jane Doe',
    token: 'NAME',
  },
  {
    id: 'street_address',
    tier: 'identity',
    format: 'redact',
    formats: ['redact', 'token', 'null'],
    sample: '42 Market Street',
    token: 'ADDR',
  },
  {
    id: 'date_of_birth',
    tier: 'identity',
    format: 'year',
    formats: ['year', 'redact', 'token', 'null'],
    sample: '1984-03-12',
    token: 'DOB',
  },
  {
    id: 'ip_address',
    tier: 'identity',
    format: 'token',
    formats: ['token', 'redact', 'null'],
    sample: '203.0.113.42',
    token: 'IP',
  },
  {
    id: 'username',
    tier: 'identity',
    format: 'token',
    formats: ['token', 'initial', 'redact', 'null'],
    sample: 'jdoe84',
    token: 'USER',
  },
  {
    id: 'geo_precise',
    tier: 'identity',
    format: 'redact',
    formats: ['redact', 'token', 'null'],
    sample: '37.77493, -122.41942',
    token: 'GEO',
  },
  // quasi
  {
    id: 'postal_code',
    tier: 'quasi',
    format: 'redact',
    formats: ['redact', 'token', 'null'],
    sample: '94103',
    token: 'ZIP',
  },
  {
    id: 'gender',
    tier: 'quasi',
    format: 'redact',
    formats: ['redact', 'token', 'null'],
    sample: 'Female',
    token: 'GENDER',
  },
  {
    id: 'age',
    tier: 'quasi',
    format: 'redact',
    formats: ['redact', 'null'],
    sample: '41',
    token: 'AGE',
  },
  {
    id: 'card_expiry',
    tier: 'quasi',
    format: 'redact',
    formats: ['redact', 'year', 'null'],
    sample: '07/28',
    token: 'EXP',
  },
  {
    id: 'financial_personal',
    tier: 'quasi',
    format: 'redact',
    formats: ['redact', 'null'],
    sample: '$84,500',
    token: 'FIN',
  },
  // free text
  {
    id: 'free_text_pii',
    tier: 'free_text',
    format: 'span',
    formats: ['span', 'redact', 'null'],
    sample: 'Call Jane at 415-555-0132 or jane@example.com',
    token: 'TEXT',
  },
];

const BY_ID = new Map(CLASSES.map(c => [c.id, c]));

export function classDef(id: string | null | undefined): ClassDef | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function tierOf(id: string | null | undefined): Tier | null {
  return classDef(id)?.tier ?? null;
}

export function classesByTier(): { tier: Tier; classes: ClassDef[] }[] {
  return TIERS.map(tier => ({
    tier,
    classes: CLASSES.filter(c => c.tier === tier),
  }));
}

/** A Compliance baseline as Data Masking names it (first run, rules). */
export interface BaselineDef {
  id: string;
  /** The framework, as admins say it. */
  name: string;
  icon: string;
  /**
   * Longest admin grant the baseline allows, in hours. Mirrors the
   * baseline definitions' apply.grant_max_hours in df-masking.
   */
  grantMaxHours: number;
}

export const BASELINES: BaselineDef[] = [
  { id: 'hipaa', name: 'HIPAA', icon: 'health_and_safety', grantMaxHours: 8 },
  { id: 'pci_dss', name: 'PCI DSS', icon: 'credit_card', grantMaxHours: 8 },
  { id: 'glba', name: 'GLBA', icon: 'account_balance', grantMaxHours: 24 },
  { id: 'cjis', name: 'CJIS', icon: 'gavel', grantMaxHours: 8 },
  { id: 'gdpr', name: 'GDPR', icon: 'privacy_tip', grantMaxHours: 24 },
  { id: 'soc2', name: 'SOC 2', icon: 'verified_user', grantMaxHours: 24 },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    icon: 'workspace_premium',
    grantMaxHours: 24,
  },
];

export function baselineDef(id: string): BaselineDef | undefined {
  return BASELINES.find(b => b.id === id);
}
