/**
 * Focused regressions for the submit path in DfScriptDetailsComponent.
 *
 * These tests do not boot the full component — Angular Router + transloco +
 * Material make a full TestBed harness expensive. We exercise the pure
 * fallback and grep the committed HTML/TS to prove that the wiring which
 * broke a customer install on 2026-04-22 cannot silently regress.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const HTML_SRC = readFileSync(
  join(__dirname, 'df-script-details.component.html'),
  'utf8'
);
const TS_SRC = readFileSync(
  join(__dirname, 'df-script-details.component.ts'),
  'utf8'
);

describe('DfScriptDetailsComponent submit logic', () => {
  it('falls back on empty completeScriptName to selectedRouteItem', () => {
    // selectedServiceItemEvent() resets completeScriptName to '' (not null).
    // The old code used `??` which does not treat '' as missing, so
    // scriptItem.name became '' and the POST URL dropped the resource name
    // producing a 400 "No record(s) detected" from the backend.
    const completeScriptName = '';
    const selectedRouteItem = 'test_underscore._schema.get.pre_process';

    const name = completeScriptName || selectedRouteItem;

    expect(name).toBe('test_underscore._schema.get.pre_process');
  });

  it('prefers completeScriptName when set by selectedTable/selectedRoute', () => {
    const completeScriptName = 'db._schema.table_name.get.pre_process';
    const selectedRouteItem = 'db._schema.{table_name}.get.pre_process';

    const name = completeScriptName || selectedRouteItem;

    expect(name).toBe('db._schema.table_name.get.pre_process');
  });

  it('submit source uses `||` (not `??`) for the name fallback', () => {
    // Guard the exact call site — `??` would regress the empty-string bug.
    expect(TS_SRC).toMatch(
      /name:\s*this\.completeScriptName\s*\|\|\s*this\.selectedRouteItem/
    );
    expect(TS_SRC).not.toMatch(
      /name:\s*this\.completeScriptName\s*\?\?\s*this\.selectedRouteItem/
    );
  });
});

describe('DfScriptDetailsComponent template wiring contract', () => {
  // The three mat-selects must fire their change handlers. Removing any
  // (selectionChange) binding was what broke saving on the customer call.
  it('Script Method mat-select has (selectionChange)="selectedRoute()"', () => {
    const methodBlock = HTML_SRC.match(
      /scripts\.scriptMethod[\s\S]*?<\/mat-form-field>/
    );
    expect(methodBlock).not.toBeNull();
    expect(methodBlock![0]).toContain('(selectionChange)="selectedRoute()"');
  });

  it('Service mat-select has (selectionChange)="selectedServiceItemEvent()"', () => {
    const serviceBlock = HTML_SRC.match(
      /'service' \| transloco[\s\S]*?<\/mat-form-field>/
    );
    expect(serviceBlock).not.toBeNull();
    expect(serviceBlock![0]).toContain(
      '(selectionChange)="selectedServiceItemEvent()"'
    );
  });

  it('Script Type mat-select has (selectionChange)="selectedEventItemEvent()"', () => {
    const typeBlock = HTML_SRC.match(
      /scripts\.scriptType[\s\S]*?<\/mat-form-field>/
    );
    expect(typeBlock).not.toBeNull();
    expect(typeBlock![0]).toContain(
      '(selectionChange)="selectedEventItemEvent()"'
    );
  });
});

describe('DfScriptDetailsComponent service lookup key', () => {
  // /system/event responses are exempt from the case interceptor
  // (see case.interceptor.ts). The component must look up
  // response[serviceName] with the raw service name; the hardcoded
  // api_docs -> apiDocs rename must NOT return.
  it('does not reintroduce the api_docs → apiDocs rename', () => {
    expect(TS_SRC).not.toMatch(/serviceKey\s*=\s*['"]apiDocs['"]/);
  });

  it('looks up events using the raw serviceName', () => {
    expect(TS_SRC).toMatch(/response\[serviceName\]/);
  });
});
