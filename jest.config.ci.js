/**
 * CI Jest config.
 *
 * Extends the base jest.config.js and runs every spec, so a regression in any
 * suite fails CI. Specs are no longer listed one by one: a new spec is picked
 * up automatically.
 *
 * Tests that fail on a real product defect rather than a stale test are marked
 * `describe.skip` in the spec itself, with the issue number (currently #561 in
 * df-email-template-details.component.spec.ts).
 */
const base = require('./jest.config');

module.exports = {
  ...base,
};
