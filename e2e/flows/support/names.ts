/** Unique names for everything a flow creates. */
export const E2E_PREFIX = 'e2e_';

const RUN_ID =
  Date.now().toString(36).slice(-5) +
  Math.random().toString(36).slice(2, 5).padEnd(3, '0');

let counter = 0;

/** `e2e_<kind>_<run>_<n>`: lower case, digits and underscores only. */
export function uniqueName(kind: string): string {
  counter += 1;
  return `${E2E_PREFIX}${kind}_${RUN_ID}_${counter}`;
}
