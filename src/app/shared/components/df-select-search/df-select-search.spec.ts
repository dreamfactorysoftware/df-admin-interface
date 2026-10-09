import { DfSearchPipe, componentTypes } from './df-select-search.component';

describe('DfSearchPipe', () => {
  const pipe = new DfSearchPipe();
  const components = [
    '',
    '*',
    '_spec',
    '_schema/',
    '_schema/*',
    '_schema/orders/',
    '_table/',
    '_table/*',
    '_table/orders/',
    '_table/orders/*',
    '_table/users/',
    '_func/',
    '_func/order_total/',
  ];

  it('returns the list untouched when there is no filter', () => {
    expect(pipe.transform(components)).toBe(components);
  });

  it('keeps only the chosen type, its own wildcards and matches', () => {
    expect(pipe.transform(components, 'ORD', '_table/')).toEqual([
      '_table/',
      '_table/*',
      '_table/orders/',
      '_table/orders/*',
    ]);
  });

  it('matches on the part after the type, not the prefix', () => {
    expect(pipe.transform(components, 'table', '_table/')).toEqual([
      '_table/',
      '_table/*',
    ]);
  });

  it('keeps the global wildcards when searching all types', () => {
    expect(pipe.transform(components, 'total')).toEqual([
      '',
      '*',
      '_func/order_total/',
    ]);
  });

  it('reads labels off objects by key', () => {
    const roles = [{ name: 'Admin' }, { name: 'reader' }];
    expect(pipe.transform(roles, 'adm', '', 'name')).toEqual([roles[0]]);
  });
});

describe('componentTypes', () => {
  it('derives one type per first path segment', () => {
    expect(
      componentTypes(['', '*', '_spec', '_table/', '_table/x/', 'admin/*'])
    ).toEqual([
      { prefix: '_table/', label: '_table', labelKey: 'selectSearch.table' },
      { prefix: 'admin/', label: 'admin', labelKey: undefined },
    ]);
  });
});
