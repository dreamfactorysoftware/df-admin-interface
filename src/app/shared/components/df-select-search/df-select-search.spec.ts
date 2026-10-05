import { DfSearchPipe } from './df-select-search.component';

describe('DfSearchPipe', () => {
  const pipe = new DfSearchPipe();
  const components = [
    '',
    '*',
    '_schema/',
    '_schema/*',
    '_schema/orders',
    '_table/',
    '_table/*',
    '_table/orders',
    '_table/orders/*',
    '_table/users',
    '_func/',
    '_func/order_total',
  ];

  it('returns the list untouched when there is no filter', () => {
    expect(pipe.transform(components)).toBe(components);
  });

  it('filters by type and case-insensitive substring, keeping wildcards', () => {
    expect(pipe.transform(components, 'ORD', '_table/')).toEqual([
      '',
      '*',
      '_schema/',
      '_schema/*',
      '_table/',
      '_table/*',
      '_table/orders',
      '_table/orders/*',
      '_func/',
    ]);
  });

  it('reads labels off objects by key', () => {
    const roles = [{ name: 'Admin' }, { name: 'reader' }];
    expect(pipe.transform(roles, 'adm', '', 'name')).toEqual([roles[0]]);
  });
});
