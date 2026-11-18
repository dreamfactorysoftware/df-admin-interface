/**
 * Compliance baselines catalog: the fixed verticals, their order, icons and
 * the baseline each one opens by default. Baseline ids are fixed by the
 * backend contract (hipaa, pci_dss, glba, cjis, gdpr, soc2, iso27001), so
 * the first-run row on Data Masking can link straight to one without a
 * request. Pure TypeScript: shared with the Playwright mock.
 *
 * Labels live in i18n (`verticals.<id>`), this file only holds ids.
 */

export type Vertical =
  | 'healthcare'
  | 'payments'
  | 'banking'
  | 'government'
  | 'privacy'
  | 'general';

export interface VerticalDef {
  id: Vertical;
  /** Material icon ligature. */
  icon: string;
  /** Baseline the vertical opens on when chosen from a shortcut. */
  baseline: string;
}

export const VERTICALS: VerticalDef[] = [
  { id: 'healthcare', icon: 'health_and_safety', baseline: 'hipaa' },
  { id: 'payments', icon: 'credit_card', baseline: 'pci_dss' },
  { id: 'banking', icon: 'account_balance', baseline: 'glba' },
  { id: 'government', icon: 'gavel', baseline: 'cjis' },
  { id: 'privacy', icon: 'privacy_tip', baseline: 'gdpr' },
  { id: 'general', icon: 'verified_user', baseline: 'soc2' },
];

const ORDER = new Map(VERTICALS.map((v, i) => [v.id as string, i]));

/** Sort position of a vertical; unknown verticals go last, in order seen. */
export function verticalOrder(id: string): number {
  return ORDER.get(id) ?? VERTICALS.length;
}

export function verticalDef(id: string): VerticalDef | undefined {
  return VERTICALS.find(v => v.id === id);
}
