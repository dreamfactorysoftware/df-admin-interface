import { expect as base } from '@playwright/test';

/** `expect` for the flow suite. */
export const expect = base.configure({ timeout: 60_000 });
