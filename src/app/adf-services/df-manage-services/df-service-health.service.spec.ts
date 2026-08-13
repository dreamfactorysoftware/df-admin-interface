import { DfServiceHealthService } from './df-service-health.service';
import { ServiceHealth, ServiceRow } from 'src/app/shared/types/service';

const row = (id: number, extra: Partial<ServiceRow> = {}) =>
  ({ id, name: `svc-${id}`, ...extra }) as ServiceRow;

describe('DfServiceHealthService', () => {
  // Only derive()/withProbe() are exercised here: both are pure, and the
  // fetching half is covered where it is consumed.
  const service = new DfServiceHealthService({} as any);

  describe('derive', () => {
    it('flags a service no role grants access to', () => {
      const health = service.derive(row(1), {
        grantedServiceIds: new Set<number>(),
        hasGlobalGrant: false,
      });

      expect(health.level).toBe('danger');
      expect(health.rules.map(r => r.id)).toEqual(['noAccess']);
      expect(health.rules[0].fix).toBeDefined();
    });

    it('passes a service covered by a wildcard grant', () => {
      const health = service.derive(row(1), {
        grantedServiceIds: new Set<number>(),
        hasGlobalGrant: true,
      });

      expect(health.level).toBe('success');
      expect(health.rules).toEqual([]);
    });

    it('does not score API docs or rate limits', () => {
      // Regression: both were rules once, and both fired on every service of
      // a healthy install.
      const health = service.derive(row(1), {
        grantedServiceIds: new Set([1]),
        hasGlobalGrant: false,
      });

      expect(health.rules).toEqual([]);
    });
  });

  describe('withProbe', () => {
    const granted: ServiceHealth = { level: 'success', rules: [] };

    it('overrides a passing verdict when the service cannot answer', () => {
      const health = service.withProbe(granted, true);

      expect(health.level).toBe('danger');
      expect(health.rules.map(r => r.id)).toEqual(['cannotConnect']);
    });

    it('leads the rule list, keeping the governance rules behind it', () => {
      const ungranted = service.derive(row(1), {
        grantedServiceIds: new Set<number>(),
        hasGlobalGrant: false,
      });

      const health = service.withProbe(ungranted, true);

      expect(health.rules.map(r => r.id)).toEqual([
        'cannotConnect',
        'noAccess',
      ]);
    });

    it('clears a previous connection failure when the probe recovers', () => {
      const failed = service.withProbe(granted, true);

      const recovered = service.withProbe(failed, false);

      expect(recovered.level).toBe('success');
      expect(recovered.rules).toEqual([]);
    });

    it('keeps a governance failure when the connection is fine', () => {
      const ungranted = service.derive(row(1), {
        grantedServiceIds: new Set<number>(),
        hasGlobalGrant: false,
      });

      const health = service.withProbe(ungranted, false);

      expect(health.level).toBe('danger');
      expect(health.rules.map(r => r.id)).toEqual(['noAccess']);
    });
  });
});
