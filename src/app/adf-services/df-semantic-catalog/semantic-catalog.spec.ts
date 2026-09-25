import {
  cleanDefinition,
  filterPlaceholders,
  paramMismatch,
  serverMessage,
  stableStringify,
  summarize,
  validateDefinition,
} from './semantic-catalog';

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
    expect(validateDefinition('term', { meaning: '' }, 'x')).toContain(
      'Meaning is required.'
    );
    expect(
      validateDefinition(
        'term',
        { meaning: 'm', maps_to: { table: 't', value: 'v' } },
        'x'
      )
    ).toContain('A mapped value needs a field.');
    expect(
      validateDefinition(
        'metric',
        { table: 'orders', aggregates: [{ function: 'SUM', field: '*' }] },
        'x'
      )
    ).toContain('Aggregate 1: * only works with COUNT.');
    expect(
      validateDefinition(
        'metric',
        { table: 'orders', aggregates: [{ function: 'COUNT', field: '*' }] },
        'x'
      )
    ).toEqual([]);
    expect(
      validateDefinition(
        'query',
        { question: 'q', table: 'orders', limit: 5000 },
        ''
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
      summarize({
        kind: 'metric',
        definition: {
          table: 'orders',
          aggregates: [{ function: 'SUM', field: 'total_amount' }],
          group_by: ['status'],
        },
      })
    ).toBe('SUM(total_amount) on orders by status');
    expect(
      summarize({
        kind: 'term',
        definition: {
          meaning: 'Shipped',
          maps_to: { table: 'orders', field: 'status', value: 'shipped' },
        },
      })
    ).toBe('Shipped → orders.status = shipped');
  });

  it('prefers the raw server message over the normalized one', () => {
    expect(
      serverMessage({
        message: 'errors.databaseConstraint',
        raw: { error: { message: 'column orders.amount does not exist' } },
      })
    ).toBe('column orders.amount does not exist');
    expect(serverMessage({})).toBe('Request failed.');
  });
});
