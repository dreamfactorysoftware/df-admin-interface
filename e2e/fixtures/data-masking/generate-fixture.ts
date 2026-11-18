/**
 * Builds e2e/fixtures/data-masking/fixture.json from real classifier output.
 *
 * Input: the classifier prototype's per-database JSON
 *   ({meta, columns: {"db.table.column": {verdict, class, tier, confidence,
 *   evidence: {why, score, shapes, type, ...}}}}).
 * Output: a compact fixture the Playwright mock serves. Evidence is
 * humanized ("+75 values 256/256 (100%) pass ssn_us.dashed (strong)" ->
 * [75, "values", "256 of 256 values are valid US SSNs"]) and detector noise
 * is dropped. Each sensitive column carries `examples`: the masked rendering
 * of a REAL first-row value (fetched from a live DreamFactory) in every
 * format its class allows. Raw values are never written.
 *
 * Run (Node 18+, from the repo root):
 *   npx esbuild e2e/fixtures/data-masking/generate-fixture.ts --bundle \
 *     --platform=node --format=esm --outfile=/tmp/dm-gen.mjs
 *   DF_URL=http://127.0.0.1:8790 DF_ADMIN_EMAIL=... DF_ADMIN_PASSWORD=... \
 *     node /tmp/dm-gen.mjs \
 *       crm=<out>/corpus.hybrid.json \
 *       sports=<out>/sportsdb.hybrid.json \
 *       store=<out>/dellstore.hybrid.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLASSES,
  classDef,
} from '../../../src/app/adf-data-masking/data-masking.catalog';
import {
  applyMask,
  maskSpans,
} from '../../../src/app/adf-data-masking/mask-format';

type Line = [number, string, string];

const DETECTORS: Record<string, string> = {
  'email.syntax': 'are valid email addresses',
  'phone.formatted': 'are formatted phone numbers',
  'phone.digits': 'are phone-length digit strings',
  'street.pattern': 'look like street addresses',
  'postal.numeric': 'look like postal codes',
  'postal.us_zip4': 'are US ZIP+4 codes',
  'postal.nl': 'are Dutch postcodes',
  'postal.uk': 'are UK postcodes',
  'iban.mod97': 'are valid IBANs',
  'account.digits': 'look like account numbers',
  'ip.v4': 'are IPv4 addresses',
  'gender.values': 'are gender values',
  'money.amount': 'are money amounts',
  'expiry.shape': 'look like card expiry dates',
  'username.shape': 'look like usernames',
  'cred.password_hash': 'are password hashes',
  'cred.high_entropy': 'look like secrets',
  'cred.provider_key': 'are provider API keys',
  'cred.jwt': 'are JSON web tokens',
  'geo.precise': 'are precise coordinates',
  'age.range': 'are plausible ages',
  'card.luhn_iin': 'pass the card checksum',
  'card.shape': 'look like card numbers',
  'card.already_masked': 'are already-masked card numbers',
  'cvv.digits': 'look like card security codes',
  'passport.shape': 'look like passport numbers',
  'dl.shape': "look like driver's license numbers",
  'icd10.shape': 'are ICD-10 diagnosis codes',
  'blood_type.shape': 'are blood types',
  'ssn_us.dashed': 'are valid US SSNs',
  'ssn_us.digits': 'are 9-digit SSN candidates',
  'itin_us.dashed': 'are valid US ITINs',
  dni_es: 'are valid Spanish DNIs',
  cpf_br: 'are valid Brazilian CPFs',
  cf_it: 'are valid Italian tax codes',
  nir_fr: 'are valid French NIRs',
  nino_uk: 'are valid UK NI numbers',
  bsn_nl: 'are valid Dutch BSNs',
  steuer_id_de: 'are valid German tax IDs',
  pnr_se: 'are valid Swedish personal numbers',
};

const DETECTOR_NAMES: Record<string, string> = {
  'email.syntax': 'Email syntax',
  'phone.formatted': 'Formatted phone',
  'phone.digits': 'Phone digits',
  'street.pattern': 'Street pattern',
  'postal.numeric': 'Numeric postal code',
  'postal.us_zip4': 'US ZIP+4',
  'postal.nl': 'Dutch postcode',
  'postal.uk': 'UK postcode',
  'iban.mod97': 'IBAN checksum',
  'account.digits': 'Account digits',
  'ip.v4': 'IPv4',
  'gender.values': 'Gender values',
  'money.amount': 'Money amount',
  'expiry.shape': 'Expiry date',
  'username.shape': 'Username shape',
  'cred.password_hash': 'Password hash',
  'cred.high_entropy': 'High-entropy secret',
  'cred.provider_key': 'Provider API key',
  'cred.jwt': 'JWT',
  'geo.precise': 'Precise coordinates',
  'age.range': 'Age range',
  'card.luhn_iin': 'Card checksum (Luhn)',
  'card.shape': 'Card shape',
  'cvv.digits': 'Security code digits',
  'passport.shape': 'Passport shape',
  'dl.shape': "Driver's license shape",
  'icd10.shape': 'ICD-10 code',
  'blood_type.shape': 'Blood type',
  'ssn_us.dashed': 'US SSN',
  'itin_us.dashed': 'US ITIN',
  dni_es: 'Spanish DNI',
  cpf_br: 'Brazilian CPF',
  cf_it: 'Italian codice fiscale',
  nir_fr: 'French NIR',
  nino_uk: 'UK NI number',
  bsn_nl: 'Dutch BSN',
  steuer_id_de: 'German Steuer-ID',
  pnr_se: 'Swedish personnummer',
  'name.lexicon': 'Name lexicon',
  'dob.plausible': 'Birth date plausibility',
};

const CLASS_LABEL: Record<string, string> = {
  national_id: 'National ID',
  tax_id: 'Tax ID',
  passport_number: 'Passport number',
  drivers_license: "Driver's license",
  card_number: 'Card number',
  card_security: 'Card security code',
  bank_account: 'Bank account',
  credential: 'Credential',
  special_category: 'Health & special category',
  email: 'Email',
  phone: 'Phone',
  person_name: 'Person name',
  street_address: 'Street address',
  date_of_birth: 'Date of birth',
  ip_address: 'IP address',
  username: 'Username',
  geo_precise: 'Precise location',
  postal_code: 'Postal code',
  gender: 'Gender',
  age: 'Age',
  card_expiry: 'Card expiry',
  financial_personal: 'Personal financial',
  free_text_pii: 'Free text with personal data',
};

const classFromRule = (rule: string) => rule.split('.')[0];

/** One prototype "why" line -> [points, kind, text], or null to drop. */
export function humanize(why: string): Line | null {
  let m: RegExpMatchArray | null;
  if (why.startsWith('=')) return null;

  if ((m = why.match(/^([+-]\d+) name '([^']*)' -> .*?(strong|weak) phrase/))) {
    const promoted = /promoted by person_table/.test(why);
    return [
      Number(m[1]),
      'name',
      `Column name "${m[2]}"${promoted ? ' in a person table' : ''}`,
    ];
  }
  if ((m = why.match(/^([+-]\d+) name '([^']*)' -> /))) {
    return [Number(m[1]), 'name', `Column name "${m[2]}" matches no class`];
  }
  if (
    (m = why.match(
      /^([+-]\d+) values (\d+)\/(\d+) \(\d+%\) pass ([a-z0-9_.]+) \(\w+\)(.*)$/
    ))
  ) {
    const phrase = DETECTORS[m[4]] ?? `pass ${m[4]}`;
    const few = /halved/.test(m[5]) ? ' (few distinct values)' : '';
    return [
      Number(m[1]),
      'values',
      `${m[2]} of ${m[3]} values ${phrase}${few}`,
    ];
  }
  if ((m = why.match(/^([+-]\d+) values .*?, (\d+)% in the name lexicons/))) {
    return [Number(m[1]), 'values', `${m[2]}% of values are known names`];
  }
  if (
    (m = why.match(
      /^([+-]\d+) values date-of-birth plausible: .*?(\d+) distinct years/
    ))
  ) {
    return [
      Number(m[1]),
      'values',
      `Values look like birth dates (${m[2]} distinct years)`,
    ];
  }
  if ((m = why.match(/^([+-]\d+) values date-of-birth plausibility failed/))) {
    return [Number(m[1]), 'values', "Values don't look like birth dates"];
  }
  if ((m = why.match(/^([+-]\d+) values contradict the class/))) {
    return [Number(m[1]), 'penalty', "Values don't fit the class"];
  }
  if ((m = why.match(/^([+-]\d+) text validated PII spans in (\d+) rows/))) {
    return [
      Number(m[1]),
      'text',
      `Personal data inside the text in ${m[2]} rows`,
    ];
  }
  if ((m = why.match(/^([+-]\d+) text a few PII spans .*medium rows (\d+)/))) {
    return [
      Number(m[1]),
      'text',
      `Possible personal data inside the text in ${m[2]} rows`,
    ];
  }
  if ((m = why.match(/^\. type surrogate key/))) {
    return [0, 'context', 'Key column, never classified'];
  }
  if ((m = why.match(/^\. sample only (\d+) non-null/))) {
    return [0, 'context', `Only ${m[1]} non-null values sampled`];
  }
  if (
    (m = why.match(
      /^\. name phrase from ([a-z_]+)\.\S+ suppressed by negative "([^"]+)"/
    ))
  ) {
    const label = CLASS_LABEL[classFromRule(m[1])] ?? m[1];
    return [0, 'context', `"${m[2]}" rules out ${label.toLowerCase()}`];
  }
  if (
    (m = why.match(
      /^\. type ([a-z_]+)\.\S+ blocked by the type gate \(type:(\w+)\)/
    ))
  ) {
    const label = CLASS_LABEL[classFromRule(m[1])] ?? m[1];
    const article = /^[aeiou]/i.test(m[2]) ? 'An' : 'A';
    return [
      0,
      'context',
      `${article} ${m[2]} column can't hold ${label.toLowerCase()}`,
    ];
  }
  if (/^\. values value-only date_of_birth evidence ignored/.test(why)) {
    return [0, 'context', 'The name says this is another kind of date'];
  }
  if ((m = why.match(/^([+-]\d+) (\w+) (.*)$/))) {
    return [Number(m[1]), m[2] === 'text' ? 'text' : 'values', m[3]];
  }
  return null;
}

interface ProtoColumn {
  verdict: 'enforce' | 'review' | 'clear';
  class: string | null;
  tier: string | null;
  confidence: number;
  evidence: {
    why?: string[];
    score?: { total: number };
    shapes?: [string, number][];
    type?: { db?: string };
  };
}

async function login(base: string, email: string, password: string) {
  const res = await fetch(`${base}/api/v2/system/admin/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }).toString(),
  });
  if (!res.ok) throw new Error(`login ${res.status}`);
  return ((await res.json()) as { session_token: string }).session_token;
}

async function firstRows(
  base: string,
  token: string,
  service: string,
  table: string
): Promise<Record<string, unknown>[]> {
  const url = `${base}/api/v2/${service}/_table/${encodeURIComponent(table)}?limit=50`;
  const res = await fetch(url, {
    headers: { 'X-DreamFactory-Session-Token': token },
  });
  if (!res.ok) return [];
  return (
    ((await res.json()) as { resource?: Record<string, unknown>[] }).resource ??
    []
  );
}

async function main() {
  const base = process.env['DF_URL'] ?? 'http://127.0.0.1:8790';
  const token = await login(
    base,
    process.env['DF_ADMIN_EMAIL'] ?? 'admin@dmui.local',
    process.env['DF_ADMIN_PASSWORD'] ?? ''
  );
  const svcRes = await fetch(
    `${base}/api/v2/system/service?fields=name,label`,
    {
      headers: { 'X-DreamFactory-Session-Token': token },
    }
  );
  const labels = new Map<string, string>(
    (
      ((await svcRes.json()) as { resource: { name: string; label: string }[] })
        .resource ?? []
    ).map(s => [s.name, s.label])
  );

  const inputs = process.argv.slice(2).map(a => a.split('='));
  const services: { service: string; label: string; tables: string[] }[] = [];
  const columns: unknown[] = [];
  let meta: Record<string, unknown> = {};
  const detectorsByClass = new Map<string, Set<string>>();

  for (const [service, file] of inputs) {
    const proto = JSON.parse(readFileSync(file, 'utf8')) as {
      meta: Record<string, unknown>;
      columns: Record<string, ProtoColumn>;
    };
    meta = proto.meta;
    const byTable = new Map<string, [string, ProtoColumn][]>();
    for (const [key, col] of Object.entries(proto.columns)) {
      const [, table, ...rest] = key.split('.');
      const column = rest.join('.');
      if (!byTable.has(table)) byTable.set(table, []);
      byTable.get(table)!.push([column, col]);
      for (const why of col.evidence.why ?? []) {
        const d = why.match(/pass ([a-z0-9_.]+) \(\w+\)/)?.[1];
        if (col.class && d && DETECTOR_NAMES[d] && /^\+[1-9]/.test(why)) {
          if (!detectorsByClass.has(col.class))
            detectorsByClass.set(col.class, new Set());
          detectorsByClass.get(col.class)!.add(DETECTOR_NAMES[d]);
        }
      }
    }

    // Trim very wide demo databases: every table with a sensitive column,
    // plus a handful of all-clear tables so the rail shows faint strips too.
    let tables = [...byTable.keys()].sort((a, b) => a.localeCompare(b));
    const sensitive = tables.filter(t =>
      byTable.get(t)!.some(([, c]) => c.verdict !== 'clear')
    );
    if (tables.length > 40) {
      const clear = tables.filter(t => !sensitive.includes(t)).slice(0, 15);
      tables = tables.filter(t => sensitive.includes(t) || clear.includes(t));
    }
    services.push({ service, label: labels.get(service) ?? service, tables });

    for (const table of tables) {
      const cols = byTable.get(table)!;
      const rows = cols.some(([, c]) => c.verdict !== 'clear')
        ? await firstRows(base, token, service, table)
        : [];
      for (const [column, c] of cols) {
        const verdict =
          c.verdict === 'enforce'
            ? 'masked'
            : (c.verdict as 'review' | 'clear');
        let lines = (c.evidence.why ?? [])
          .map(humanize)
          .filter((l): l is Line => !!l);
        if (verdict === 'clear') lines = lines.slice(0, 2);
        const out: Record<string, unknown> = {
          id: `${service}.${table}.${column}`,
          service,
          table,
          column,
          type: c.evidence.type?.db ?? '',
          verdict,
          class: c.class,
          tier: c.tier,
          confidence: c.confidence,
          total: c.evidence.score?.total ?? c.confidence,
          lines,
        };
        if (verdict !== 'clear' && c.evidence.shapes?.length) {
          out['shapes'] = c.evidence.shapes.slice(0, 3);
        }
        const def = classDef(c.class);
        if (verdict !== 'clear' && def) {
          const present = rows
            .map(r => r[column])
            .filter(
              v => v !== null && v !== undefined && String(v).trim() !== ''
            )
            .map(v => String(v));
          // Free text: prefer a row that actually has a span to mask.
          // Free text: only a short prose row whose personal data was
          // actually caught; anything else would leak text, so fall back
          // to the synthetic sample.
          const raw =
            def.format === 'span'
              ? present.find(
                  v => maskSpans(v) !== v && v.length < 90 && !/^[[{]/.test(v)
                )
              : present[0];
          const value = raw === undefined ? def.sample : String(raw);
          const examples: Record<string, string | null> = {};
          for (const f of def.formats) {
            examples[f] = applyMask(value.slice(0, 120), f, def.id);
          }
          out['examples'] = examples;
        }
        columns.push(out);
      }
    }
  }

  const fixture = {
    meta: {
      ruleset: meta['ruleset'] ?? 'dreamfactory.core',
      version: String(meta['ruleset_version'] ?? '').replace(/-spike.*$/, ''),
      engine: meta['engine'],
      generated: new Date().toISOString().slice(0, 10),
    },
    services,
    builtin: CLASSES.map(c => ({
      class: c.id,
      detectors: [...(detectorsByClass.get(c.id) ?? [])].sort(),
    })),
    columns,
  };
  const here = dirname(fileURLToPath(import.meta.url));
  const outFile =
    process.env['DM_FIXTURE_OUT'] ??
    join(
      here.includes('e2e') ? here : process.cwd(),
      'e2e/fixtures/data-masking/fixture.json'
    );
  writeFileSync(outFile, JSON.stringify(fixture));
  console.log(`wrote ${outFile}: ${columns.length} columns`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
