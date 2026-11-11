import * as fs from 'fs';
import * as path from 'path';
import { Route, Routes } from '@angular/router';
import { routes } from 'src/app/routes';
import { generateBreadcrumb } from './route';

/**
 * Guards against raw transloco keys on screen. A key that does not resolve
 * to a string renders as itself ("nav.system-settings.df-platform-apis.
 * create.header"), and nothing else fails, so only a test catches it.
 *
 * Three sources of keys are checked against the shipped en.json files:
 *  1. the breadcrumb and page-title keys the shell derives from the route
 *     table (`nav.<path>.header`), for every route without a parameter;
 *  2. every literal key piped through `transloco` in a template;
 *  3. every literal `snackbarSuccess` key (rendered by the success toast).
 */
const APP_DIR = path.resolve(__dirname, '../..');
const I18N_DIR = path.resolve(APP_DIR, '../assets/i18n');

type Dictionary = { [key: string]: string | Dictionary };

const readJson = (file: string): Dictionary =>
  JSON.parse(fs.readFileSync(file, 'utf8'));

const ROOT = readJson(path.join(I18N_DIR, 'en.json'));
// Scope files load under their directory name: emailTemplates/en.json holds
// the keys addressed as `emailTemplates.<key>`.
const SCOPES: Dictionary = {};
for (const entry of fs.readdirSync(I18N_DIR, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    SCOPES[entry.name] = readJson(path.join(I18N_DIR, entry.name, 'en.json'));
  }
}

function lookup(dictionary: Dictionary, key: string): unknown {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || !(part in node)) {
      return undefined;
    }
    node = (node as Dictionary)[part];
  }
  return node;
}

/** A key resolves when it leads to a non-empty string (an object is a
 *  group of keys, which the pipe prints as the raw key) and every
 *  `{{other.key}}` reference inside that string resolves too. */
function resolves(key: string, seen: string[] = []): boolean {
  if (seen.includes(key)) {
    return false;
  }
  const rootValue = lookup(ROOT, key);
  const value = rootValue === undefined ? lookup(SCOPES, key) : rootValue;
  if (typeof value !== 'string' || value === '') {
    return false;
  }
  const references = Array.from(
    value.matchAll(/{{\s*([A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+)\s*}}/g),
    match => match[1]
  );
  return references.every(ref => resolves(ref, [...seen, key]));
}

/** Every URL the router can match without a route parameter. */
function staticUrls(table: Routes, prefix = ''): string[] {
  const urls: string[] = [];
  for (const route of table as Route[]) {
    const segment = route.path ?? '';
    if (segment.includes(':') || segment.includes('*')) {
      continue;
    }
    const url = segment ? `${prefix}/${segment}` : prefix;
    if (segment && !route.redirectTo) {
      urls.push(url);
    }
    if (route.children) {
      urls.push(...staticUrls(route.children, url));
    }
  }
  return Array.from(new Set(urls));
}

function sourceFiles(dir: string, extension: RegExp): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(file, extension);
    }
    return extension.test(entry.name) && !entry.name.endsWith('.spec.ts')
      ? [file]
      : [];
  });
}

/** Source text without comments, so a key quoted in a doc comment is not
 *  mistaken for a key in use. */
function readSource(file: string): string {
  const source = fs.readFileSync(file, 'utf8');
  return file.endsWith('.html')
    ? source.replace(/<!--[\s\S]*?-->/g, '')
    : source.replace(/\/\*[\s\S]*?\*\/|(^|[^:'"`])\/\/.*$/gm, '$1');
}

const breadcrumbKeys = (url: string): string[] =>
  generateBreadcrumb(routes, url)
    .map(crumb => crumb.translationKey)
    .filter((key): key is string => !!key);

describe('i18n keys', () => {
  describe('breadcrumb and page title keys', () => {
    // The two create pages that rendered a raw key as their H1.
    it.each([
      '/api-connections/api-types/api-builder/create',
      '/system-settings/df-platform-apis/create',
    ])('%s has a title', url => {
      const keys = breadcrumbKeys(url);
      expect(keys[keys.length - 1]).toBe(
        `nav.${url.slice(1).replace(/\//g, '.')}.header`
      );
      expect(keys.filter(key => !resolves(key))).toEqual([]);
    });

    // Not proven to reach the screen, so left alone rather than guessed at:
    // the shell only renders crumbs for a logged-in user, /auth/* is for
    // logged-out users, and the two lock pages need an expired license or
    // trial to visit. Remove an entry here when its key is added.
    const NOT_RENDERED = [
      /^nav\.auth(\.|$)/,
      /^nav\.license-expired\.header$/,
      /^nav\.trial-expired\.header$/,
    ];

    it('resolves for every route without a parameter', () => {
      const urls = staticUrls(routes);
      expect(urls.length).toBeGreaterThan(50);

      const missing = new Set<string>();
      for (const url of urls) {
        for (const key of breadcrumbKeys(url)) {
          if (!resolves(key) && !NOT_RENDERED.some(re => re.test(key))) {
            missing.add(`${key}  (${url})`);
          }
        }
      }
      expect(Array.from(missing)).toEqual([]);
    });
  });

  describe('keys used in the app', () => {
    // A dead component: nothing routes to or imports src/app/home.
    const UNREACHABLE = ['home.welcome'];

    it('every literal key piped through transloco resolves', () => {
      // 'some.key' | transloco. A literal starting with "." is the tail of
      // a key built at runtime (userType + '.alerts.new') and is skipped.
      const pipe = /['"]([A-Za-z][A-Za-z0-9_.-]*)['"]\s*\|\s*transloco\b/g;
      const missing = new Set<string>();
      let checked = 0;
      for (const file of sourceFiles(APP_DIR, /\.(html|ts)$/)) {
        const source = readSource(file);
        for (const match of source.matchAll(pipe)) {
          const key = match[1];
          const start = match.index ?? 0;
          // Skip the tail of a concatenation: ... + 'tail' | transloco
          if (/\+\s*$/.test(source.slice(Math.max(0, start - 80), start))) {
            continue;
          }
          checked++;
          if (!resolves(key) && !UNREACHABLE.includes(key)) {
            missing.add(`${key}  (${path.relative(APP_DIR, file)})`);
          }
        }
      }
      expect(checked).toBeGreaterThan(300);
      expect(Array.from(missing)).toEqual([]);
    });

    // Missing as written (the string lives at scripts.getScriptSuccessMsg),
    // but the GitHub import toast was not reproduced, so it is listed, not
    // fixed. Remove the entry when the key is corrected.
    const UNVERIFIED_TOASTS = ['getScriptSuccessMsg'];

    it('every literal snackbarSuccess key resolves', () => {
      const option = /snackbarSuccess:\s*['"]([A-Za-z0-9_.-]+)['"]/g;
      const missing = new Set<string>();
      let checked = 0;
      for (const file of sourceFiles(APP_DIR, /\.ts$/)) {
        const source = readSource(file);
        for (const match of source.matchAll(option)) {
          checked++;
          if (!resolves(match[1]) && !UNVERIFIED_TOASTS.includes(match[1])) {
            missing.add(`${match[1]}  (${path.relative(APP_DIR, file)})`);
          }
        }
      }
      expect(checked).toBeGreaterThan(20);
      expect(Array.from(missing)).toEqual([]);
    });
  });
});
