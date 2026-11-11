/**
 * Where the flow suite runs and who it logs in as. The suite writes to the
 * backend, so it refuses port 8081 (the shared dev stack).
 */
export const BASE_URL =
  process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:8080';

export const APP = '/dreamfactory/dist/';

export interface Credentials {
  email: string;
  password: string;
}

export const ROOT_ADMIN: Credentials = {
  email: process.env['DF_ADMIN_EMAIL'] ?? 'admin@dreamfactory.com',
  password: process.env['DF_ADMIN_PASSWORD'] ?? 'passwordpassword',
};

/** Seeded records the flows read (never modify). */
export const SEED = {
  /** Marker: an instance without this service is not the gate stack. */
  sampleDbService: 'gate_sample_db',
  appPrefix: 'gate_app_',
  userPrefix: 'gate_user_',
};

const FORBIDDEN_PORT = '8081';

function portOf(url: string): string {
  try {
    const u = new URL(url);
    return u.port || (u.protocol === 'https:' ? '443' : '80');
  } catch {
    return '';
  }
}

/** Throws when the target URL is the shared dev stack. */
export function assertWritableTarget(): void {
  if (portOf(BASE_URL) === FORBIDDEN_PORT) {
    throw new Error(
      `e2e/flows refuses to run: PLAYWRIGHT_BASE_URL=${BASE_URL} is port ` +
        `${FORBIDDEN_PORT}, the shared dev stack. The flow suite writes to ` +
        'the backend and only runs against the seeded gate stack.'
    );
  }
}
