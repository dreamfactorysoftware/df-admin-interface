import {
  cleanDefinition,
  filterPlaceholders,
  isAutomated,
  paramMismatch,
  parseExportDoc,
  reviewCounts,
  serverMessage,
  stableStringify,
  summarize,
  validateDefinition,
} from './semantic-catalog';
import { enT } from './semantic-i18n.testing';

describe('semantic catalog helpers', () => {
  it('finds distinct filter placeholders in first-use order', () => {
    expect(
      filterPlaceholders('a = {x} and b = {y_1} or c = {x} and d = {9bad}')
    ).toEqual(['x', 'y_1']);
    expect(filterPlaceholders(undefined)).toEqual([]);
  });

  it('reports undeclared and unused params', () => {
    expect(
      paramMismatch('region = {region} and id = {id}', [
        { name: 'id', type: 'integer' },
        { name: 'since', type: 'date' },
      ])
    ).toEqual({ undeclared: ['region'], unused: ['since'] });
    expect(
      paramMismatch('id = {id}', [{ name: 'id', type: 'integer' }])
    ).toEqual({ undeclared: [], unused: [] });
  });

  it('mirrors the cheap server checks per kind', () => {
    expect(validateDefinition('term', { meaning: '' }, 'x', enT)).toContain(
      'Meaning is required.'
    );
    expect(
      validateDefinition(
        'term',
        { meaning: 'm', maps_to: { table: 't', value: 'v' } },
        'x',
        enT
      )
    ).toContain('A mapped value needs a field.');
    expect(
      validateDefinition(
        'metric',
        { table: 'orders', aggregates: [{ function: 'SUM', field: '*' }] },
        'x',
        enT
      )
    ).toContain('Aggregate 1: * only works with COUNT.');
    expect(
      validateDefinition(
        'metric',
        { table: 'orders', aggregates: [{ function: 'COUNT', field: '*' }] },
        'x',
        enT
      )
    ).toEqual([]);
    expect(
      validateDefinition(
        'query',
        { question: 'q', table: 'orders', limit: 5000 },
        '',
        enT
      )
    ).toEqual([
      'Name is required.',
      'Limit must be a whole number from 1 to 1000.',
    ]);
  });

  it('drops empty optionals and keeps required explicit on params', () => {
    expect(
      cleanDefinition('query', {
        question: ' Orders? ',
        table: 'orders',
        fields: [],
        filter: 'customer_id = {cid}',
        order: '',
        limit: null,
        related: '',
        params: [
          { name: 'cid', type: 'integer', required: true, description: '' },
          { name: '', type: 'string' },
        ],
      })
    ).toEqual({
      question: 'Orders?',
      table: 'orders',
      filter: 'customer_id = {cid}',
      params: [{ name: 'cid', type: 'integer', required: true }],
    });
    expect(
      cleanDefinition('term', {
        meaning: 'm',
        synonyms: [],
        maps_to: { table: 'orders', field: '', value: 'x', filter: '' },
      })
    ).toEqual({ meaning: 'm', maps_to: { table: 'orders' } });
  });

  it('compares definitions independent of key order', () => {
    expect(stableStringify({ b: 1, a: [{ y: 2, x: 1 }] })).toBe(
      stableStringify({ a: [{ x: 1, y: 2 }], b: 1 })
    );
  });

  it('summarizes each kind in one line', () => {
    expect(
      summarize(
        {
          kind: 'metric',
          definition: {
            table: 'orders',
            aggregates: [{ function: 'SUM', field: 'total_amount' }],
            group_by: ['status'],
          },
        },
        enT
      )
    ).toBe('SUM(total_amount) on orders by status');
    expect(
      summarize(
        {
          kind: 'term',
          definition: {
            meaning: 'Shipped',
            maps_to: { table: 'orders', field: 'status', value: 'shipped' },
          },
        },
        enT
      )
    ).toBe('Shipped → orders.status = shipped');
  });

  it('cleans, validates and summarizes notes; keeps examples on metrics and queries', () => {
    expect(
      cleanDefinition('note', {
        text: ' departments has test rows ',
        severity: 'bogus',
        applies_to: [
          { table: 'departments', field: '' },
          { table: '', field: 'x' },
          { table: 'buildings', field: 'dept_no' },
        ],
      })
    ).toEqual({
      text: 'departments has test rows',
      severity: 'warning',
      applies_to: [
        { table: 'departments' },
        { table: 'buildings', field: 'dept_no' },
      ],
    });
    expect(
      cleanDefinition('note', {
        text: 'Amounts are USD',
        severity: 'info',
        applies_to: [],
      })
    ).toEqual({
      text: 'Amounts are USD',
      severity: 'info',
    });
    expect(
      validateDefinition(
        'note',
        { text: '', applies_to: [{ table: '' }] },
        'n',
        enT
      )
    ).toEqual([
      'Text is required.',
      'Applies-to 1 needs a table (or remove it).',
    ]);
    expect(validateDefinition('note', { text: 't' }, 'n', enT)).toEqual([]);
    expect(
      summarize(
        {
          kind: 'note',
          definition: {
            text: 'Test rows',
            applies_to: [
              { table: 'departments', field: 'dept_no' },
              { table: 'buildings' },
            ],
          },
        },
        enT
      )
    ).toBe('departments.dept_no, buildings: Test rows');
    expect(
      summarize({ kind: 'note', definition: { text: 'Amounts are USD' } }, enT)
    ).toBe('Amounts are USD');

    expect(
      cleanDefinition('metric', {
        table: 'orders',
        aggregates: [{ function: 'COUNT', field: '*', alias: '' }],
        examples: [' How many orders? ', '', 'Order count'],
      })
    ).toEqual({
      table: 'orders',
      aggregates: [{ function: 'COUNT', field: '*' }],
      examples: ['How many orders?', 'Order count'],
    });
    expect(
      cleanDefinition('query', { question: 'q', table: 't', examples: [] })
    ).toEqual({ question: 'q', table: 't' });
  });

  it('counts automated drafts for review and reads export documents', () => {
    expect(isAutomated('seeded')).toBe(true);
    expect(isAutomated('manual')).toBe(false);
    expect(
      reviewCounts([
        { status: 'draft', source: 'seeded' },
        { status: 'draft', source: 'seeded' },
        { status: 'draft', source: 'drafted' },
        { status: 'draft', source: 'manual' },
        { status: 'approved', source: 'seeded' },
      ])
    ).toEqual({ total: 3, bySource: { seeded: 2, drafted: 1 } });

    expect(parseExportDoc('not json')).toBeNull();
    expect(parseExportDoc('{"foo": 1}')).toBeNull();
    expect(
      parseExportDoc(
        '{"service":"db","entries":[{"kind":"term","name":"a","definition":{"meaning":"m"}}]}'
      )
    ).toEqual({
      service: 'db',
      entries: [{ kind: 'term', name: 'a', definition: { meaning: 'm' } }],
    });
    expect(
      parseExportDoc('[{"kind":"term","name":"a","definition":{}}]')?.entries
    ).toHaveLength(1);
  });

  it('prefers the raw server message over the normalized one', () => {
    expect(
      serverMessage(
        {
          message: 'errors.databaseConstraint',
          raw: { error: { message: 'column orders.amount does not exist' } },
        },
        enT
      )
    ).toBe('column orders.amount does not exist');
    expect(serverMessage({}, enT)).toBe('Request failed.');
  });

  it('builds every message from i18n keys, with no English of its own', () => {
    const keys = (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key;
    expect(
      validateDefinition(
        'metric',
        {
          table: '',
          aggregates: [{ function: 'AVG', field: '*' }],
          params: [{ name: '9x', type: '' }],
        },
        '',
        keys
      )
    ).toEqual([
      'validation.name',
      'validation.table',
      'validation.aggStar:{"n":1}',
      'validation.paramName:{"name":"9x"}',
      'validation.paramType:{"name":"9x"}',
    ]);
    expect(
      summarize(
        {
          kind: 'metric',
          definition: {
            table: 'orders',
            aggregates: [{ function: 'SUM', field: 'total' }],
            group_by: ['status'],
            filter: 'x = 1',
          },
        },
        keys
      )
    ).toBe(
      'summary.on:{"aggregates":"SUM(total)","table":"orders"}' +
        'summary.by:{"fields":"status"}summary.where:{"filter":"x = 1"}'
    );
    expect(serverMessage({}, keys)).toBe('errors.requestFailed');
  });
});
