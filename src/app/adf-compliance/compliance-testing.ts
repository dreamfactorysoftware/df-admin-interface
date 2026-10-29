/** Shared Jest helpers for the Compliance specs. */
import { Translation, TranslocoTestingModule } from '@ngneat/transloco';
import { MaskingOverview } from 'src/app/adf-data-masking/data-masking.types';
import {
  BaselineControl,
  BaselineDetail,
  BaselineSummary,
} from './compliance.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CP: Translation = require('../../assets/i18n/compliance/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DM: Translation = require('../../assets/i18n/dataMasking/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ROOT: Translation = require('../../assets/i18n/en.json');

export function cpTransloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { ...ROOT, compliance: CP, dataMasking: DM } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

export function summary(over: Partial<BaselineSummary> = {}): BaselineSummary {
  return {
    id: 'hipaa',
    name: 'HIPAA',
    vertical: 'healthcare',
    frameworks: ['HIPAA Security Rule'],
    adopted: false,
    score: { pass: 9, fail: 3, manual: 2, total: 14 },
    ...over,
  };
}

export function control(over: Partial<BaselineControl> = {}): BaselineControl {
  return {
    id: 'masking.mode',
    title: 'Masking is on',
    refs: ['45 CFR 164.312(a)(1)'],
    status: 'pass',
    detail: null,
    fix: { kind: 'none', route: null },
    ...over,
  };
}

export function detail(over: Partial<BaselineDetail> = {}): BaselineDetail {
  return {
    id: 'hipaa',
    name: 'HIPAA',
    vertical: 'healthcare',
    frameworks: ['HIPAA Security Rule'],
    adopted: false,
    adoptedAt: null,
    appliedAt: null,
    controls: [
      control(),
      control({
        id: 'masking.review',
        title: 'Review queue is empty',
        status: 'fail',
        detail: '24 columns to review',
        refs: ['45 CFR 164.514(b)'],
        fix: {
          kind: 'link',
          route: '/api-security/data-masking?tab=columns',
        },
      }),
      control({
        id: 'access.ai',
        title: 'AI sessions always see masked values',
        status: 'fail',
        refs: ['45 CFR 164.312(a)(1)'],
        fix: { kind: 'apply', route: null },
      }),
      control({
        id: 'platform.rate_limit',
        title: 'Rate limits are active',
        status: 'na',
        refs: [],
      }),
      control({
        id: 'manual.encryption',
        title: 'Encryption at rest on your databases',
        status: 'manual',
        refs: ['45 CFR 164.312(a)(2)(iv)'],
      }),
    ],
    changes: [
      { id: 'access.ai', text: 'AI and MCP sessions: always masked' },
      { id: 'masking.mode', text: 'Masking mode: Preview' },
    ],
    ...over,
  };
}

/** A masking overview as the store reads it (scanned unless said). */
export function overview(
  mode: 'off' | 'preview' | 'on',
  scan: Record<string, unknown> = {}
): MaskingOverview {
  return {
    mode,
    scan: {
      status: 'idle',
      finishedAt: '2026-10-28T10:00:00Z',
      columns: 40,
      ...scan,
    },
    counts: { masked: 10, review: 2, clear: 28 },
    you: { canGrant: true, seesRealValues: false },
  } as MaskingOverview;
}
