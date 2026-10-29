import { DfSystemInfoComponent } from './df-system-info.component';

// Pure-class spec (df-system-info.component.spec.ts is quarantined).
describe('DfSystemInfoComponent log level link', () => {
  const make = (user: unknown) =>
    new DfSystemInfoComponent(
      {} as never,
      { environment: {} } as never,
      {} as never,
      { userData: user } as never
    );

  it('shows the Change link to sys admins only', () => {
    expect(make({ isSysAdmin: true }).canEditServerSettings).toBe(true);
    expect(make({ isSysAdmin: false }).canEditServerSettings).toBe(false);
    expect(make(null).canEditServerSettings).toBe(false);
  });
});
