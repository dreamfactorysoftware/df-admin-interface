/** Shared Jest helpers for the Data Masking specs. */
import { Translation, TranslocoTestingModule } from '@ngneat/transloco';
import { MaskedColumn } from './data-masking.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DM: Translation = require('../../assets/i18n/dataMasking/en.json');

export function dmTransloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { dataMasking: DM } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

export function column(over: Partial<MaskedColumn> = {}): MaskedColumn {
  return {
    id: 'crm.users.ssn',
    service: 'crm',
    table: 'users',
    column: 'ssn',
    type: 'varchar(11)',
    verdict: 'masked',
    class: 'national_id',
    tier: 'restricted',
    source: 'detected',
    confidence: 100,
    example: '•••-••-4821',
    format: 'last4',
    evidence: {
      total: 100,
      thresholdMask: 70,
      thresholdReview: 40,
      lines: [{ points: 70, kind: 'name', text: 'Column name "ssn"' }],
      shapes: [['999-99-9999', 100]],
    },
    ...over,
  };
}
