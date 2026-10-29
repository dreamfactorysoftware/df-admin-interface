import { of } from 'rxjs';
import { DfSystemInfoComponent } from './df-system-info.component';

// Pure-class spec (df-system-info.component.spec.ts is quarantined).
describe('DfSystemInfoComponent log level link', () => {
  const make = (user: unknown, tabs: string[] = []) =>
    new DfSystemInfoComponent(
      {} as never,
      { environment: {} } as never,
      {} as never,
      { userData: user, restrictedAccess$: of(tabs) } as never
    );

  it('shows the Change link to full admins', () => {
    expect(make({ isSysAdmin: true }).canEditServerSettings).toBe(true);
  });

  it('shows the Change link to a restricted admin with the config tab only', () => {
    const user = { isSysAdmin: true, roleId: 3 };
    expect(make(user, ['config']).canEditServerSettings).toBe(true);
    expect(make(user, ['apps']).canEditServerSettings).toBe(false);
  });

  it('hides the Change link from non-admins and a missing session', () => {
    expect(make({ isSysAdmin: false }).canEditServerSettings).toBe(false);
    expect(make(null).canEditServerSettings).toBe(false);
  });
});
