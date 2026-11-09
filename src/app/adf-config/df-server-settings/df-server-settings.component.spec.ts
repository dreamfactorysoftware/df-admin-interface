import { of, throwError } from 'rxjs';
import { DfServerSettingsComponent } from './df-server-settings.component';
import { ServerSetting } from '../../shared/types/server-setting';

const row = (over: Partial<ServerSetting> = {}): ServerSetting => ({
  name: 'log_level',
  label: 'Log level',
  value: 'info',
  envValue: 'info',
  source: 'env',
  allowedValues: ['debug', 'info', 'error'],
  ...over,
});

// Pure-class spec: the transloco TestBed is quarantined under ESM.
describe('DfServerSettingsComponent', () => {
  let service: { load: jest.Mock; update: jest.Mock; reset: jest.Mock };
  let dialog: { open: jest.Mock };
  let component: DfServerSettingsComponent;

  const make = () =>
    new DfServerSettingsComponent(service as never, dialog as never);

  beforeEach(() => {
    service = {
      load: jest.fn(() => of([row()])),
      update: jest.fn(),
      reset: jest.fn(),
    };
    dialog = { open: jest.fn(() => ({ afterClosed: () => of(true) })) };
    component = make();
    component.ngOnInit();
  });

  it('maps rows with a draft equal to the current value', () => {
    expect(component.rows).toHaveLength(1);
    expect(component.rows[0].draft).toBe('info');
    expect(component.loading).toBe(false);
  });

  it('disables reset while the source is env', () => {
    expect(component.canReset(component.rows[0])).toBe(false);
    component.rows[0].setting = row({ source: 'override', value: 'error' });
    expect(component.canReset(component.rows[0])).toBe(true);
  });

  it('save calls update then swaps the row', () => {
    service.update.mockReturnValue(
      of({
        setting: row({ value: 'error', source: 'override' }),
        environmentRefreshed: true,
      })
    );
    component.rows[0].draft = 'error';
    component.save(component.rows[0]);
    expect(service.update).toHaveBeenCalledWith('log_level', 'error');
    expect(component.rows[0].setting.source).toBe('override');
    expect(component.rows[0].setting.value).toBe('error');
    expect(component.saved).toBe(true);
    expect(component.stale).toBe(false);
    expect(component.error).toBeNull();
  });

  // Regression: this used to report "Could not save" and revert the draft.
  it('a save whose environment refresh failed is still a save, flagged stale', () => {
    service.update.mockReturnValue(
      of({
        setting: row({ value: 'error', source: 'override' }),
        environmentRefreshed: false,
      })
    );
    component.rows[0].draft = 'error';
    component.save(component.rows[0]);
    expect(component.rows[0].setting.value).toBe('error');
    expect(component.rows[0].setting.source).toBe('override');
    expect(component.rows[0].draft).toBe('error');
    expect(component.saved).toBe(true);
    expect(component.stale).toBe(true);
    expect(component.error).toBeNull();
  });

  it('the stale note clears on the next successful save', () => {
    service.update.mockReturnValue(
      of({ setting: row({ value: 'error' }), environmentRefreshed: false })
    );
    component.save(component.rows[0]);
    service.update.mockReturnValue(
      of({ setting: row({ value: 'debug' }), environmentRefreshed: true })
    );
    component.save(component.rows[0]);
    expect(component.saved).toBe(true);
    expect(component.stale).toBe(false);
  });

  it('a failed save keeps the old value and sets the error', () => {
    service.update.mockReturnValue(throwError(() => new Error('boom')));
    component.rows[0].draft = 'error';
    component.save(component.rows[0]);
    expect(component.rows[0].setting.value).toBe('info');
    expect(component.rows[0].draft).toBe('info');
    expect(component.error).toBe('serverSettings.saveError');
    expect(component.saved).toBe(false);
    expect(component.stale).toBe(false);
  });

  it('reset asks for confirmation, then swaps the row back to env', () => {
    component.rows[0].setting = row({ source: 'override', value: 'error' });
    service.reset.mockReturnValue(
      of({ setting: row(), environmentRefreshed: true })
    );
    component.reset(component.rows[0]);
    expect(dialog.open).toHaveBeenCalled();
    expect(service.reset).toHaveBeenCalledWith('log_level');
    expect(component.rows[0].setting.source).toBe('env');
    expect(component.saved).toBe(true);
    expect(component.stale).toBe(false);
  });

  it('a reset whose environment refresh failed still resets, flagged stale', () => {
    component.rows[0].setting = row({ source: 'override', value: 'error' });
    service.reset.mockReturnValue(
      of({ setting: row(), environmentRefreshed: false })
    );
    component.reset(component.rows[0]);
    expect(component.rows[0].setting.source).toBe('env');
    expect(component.rows[0].draft).toBe('info');
    expect(component.saved).toBe(true);
    expect(component.stale).toBe(true);
    expect(component.error).toBeNull();
  });

  it('a failed reset keeps the override and sets the error', () => {
    component.rows[0].setting = row({ source: 'override', value: 'error' });
    service.reset.mockReturnValue(throwError(() => new Error('boom')));
    component.reset(component.rows[0]);
    expect(component.rows[0].setting.source).toBe('override');
    expect(component.error).toBe('serverSettings.saveError');
    expect(component.saved).toBe(false);
  });

  it('sets the error when loading fails', () => {
    service.load.mockReturnValue(throwError(() => new Error('nope')));
    component = make();
    component.ngOnInit();
    expect(component.error).toBe('serverSettings.loadError');
    expect(component.unavailable).toBe(false);
    expect(component.loading).toBe(false);
  });

  it('shows the not-available state on a backend without the resource', () => {
    service.load.mockReturnValue(of(null));
    component = make();
    component.ngOnInit();
    expect(component.unavailable).toBe(true);
    expect(component.error).toBeNull();
    expect(component.rows).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('tells a restricted admin without the grant why loading was refused', () => {
    service.load.mockReturnValue(throwError(() => ({ status: 403 })));
    component = make();
    component.ngOnInit();
    expect(component.error).toBe('serverSettings.forbidden');
    expect(component.unavailable).toBe(false);
  });
});
