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
  let service: { getAll: jest.Mock; update: jest.Mock; reset: jest.Mock };
  let dialog: { open: jest.Mock };
  let component: DfServerSettingsComponent;

  const make = () =>
    new DfServerSettingsComponent(service as never, dialog as never);

  beforeEach(() => {
    service = {
      getAll: jest.fn(() => of([row()])),
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
      of(row({ value: 'error', source: 'override' }))
    );
    component.rows[0].draft = 'error';
    component.save(component.rows[0]);
    expect(service.update).toHaveBeenCalledWith('log_level', 'error');
    expect(component.rows[0].setting.source).toBe('override');
    expect(component.rows[0].setting.value).toBe('error');
    expect(component.saved).toBe(true);
  });

  it('a failed save keeps the old value and sets the error', () => {
    service.update.mockReturnValue(throwError(() => new Error('boom')));
    component.rows[0].draft = 'error';
    component.save(component.rows[0]);
    expect(component.rows[0].setting.value).toBe('info');
    expect(component.rows[0].draft).toBe('info');
    expect(component.error).toBeTruthy();
  });

  it('reset asks for confirmation, then swaps the row back to env', () => {
    component.rows[0].setting = row({ source: 'override', value: 'error' });
    service.reset.mockReturnValue(of(row()));
    component.reset(component.rows[0]);
    expect(dialog.open).toHaveBeenCalled();
    expect(service.reset).toHaveBeenCalledWith('log_level');
    expect(component.rows[0].setting.source).toBe('env');
  });

  it('sets the error when loading fails', () => {
    service.getAll.mockReturnValue(throwError(() => new Error('nope')));
    component = make();
    component.ngOnInit();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBe(false);
  });
});
