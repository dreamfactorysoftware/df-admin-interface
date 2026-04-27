import { of, throwError } from 'rxjs';
import { DfRoleScopeComponent } from './df-role-scope.component';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';

/**
 * Pure-class tests — no TestBed, no template render. The component template
 * uses the transloco pipe which Jest can't resolve under our ESM
 * configuration; we test the data-shaping logic directly via the component
 * instance instead.
 */
describe('DfRoleScopeComponent (logic)', () => {
  let component: DfRoleScopeComponent;
  let roleService: { get: jest.Mock };
  let servicesService: { getAll: jest.Mock };

  const services = [
    { id: 3, name: 'db', type: 'sqlite' },
    { id: 5, name: 'fdny_mock', type: 'sqlsrv' },
    { id: 9, name: 'billing_db', type: 'sqlsrv' },
  ];

  const role = {
    id: 12,
    name: 'testing_scoped_role',
    description: 'Read-only test role',
    isActive: true,
    roleServiceAccessByRoleId: [
      {
        id: 1,
        roleId: 12,
        serviceId: 3,
        component: '_table/customers',
        verbMask: 1,
        requestorMask: 1,
      },
      {
        id: 2,
        roleId: 12,
        serviceId: 3,
        component: '_table/orders',
        verbMask: 31,
        requestorMask: 3,
      },
    ],
  };

  beforeEach(() => {
    roleService = { get: jest.fn().mockReturnValue(of(role)) };
    servicesService = {
      getAll: jest.fn().mockReturnValue(of({ resource: services })),
    };
    component = new DfRoleScopeComponent(
      roleService as unknown as DfBaseCrudService,
      servicesService as unknown as DfBaseCrudService
    );
  });

  function loadFor(id: number | null | undefined): void {
    component.roleId = id;
    component.ngOnChanges({
      roleId: {
        previousValue: null,
        currentValue: id,
        firstChange: true,
        isFirstChange: () => true,
      },
    } as never);
  }

  it('does nothing until roleId is set', () => {
    loadFor(null);
    expect(roleService.get).not.toHaveBeenCalled();
  });

  it('groups multiple access rules by service and decodes verb masks', () => {
    loadFor(12);
    expect(component.allowedServices.length).toBe(1);
    const dbEntry = component.allowedServices[0];
    expect(dbEntry.service.name).toBe('db');

    const customers = dbEntry.rules.find(
      r => r.component === '_table/customers'
    );
    expect(customers?.verbs).toEqual(['GET']);
    expect(customers?.requesters).toEqual(['API']);

    const orders = dbEntry.rules.find(r => r.component === '_table/orders');
    expect(orders?.verbs).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    expect(orders?.requesters).toEqual(['API', 'SCRIPT']);
  });

  it('lists denied services (alphabetically)', () => {
    loadFor(12);
    expect(component.deniedServices.map(s => s.name)).toEqual([
      'billing_db',
      'fdny_mock',
    ]);
  });

  it('skips denied list when showDeniedServices is false', () => {
    component.showDeniedServices = false;
    loadFor(12);
    expect(component.deniedServices).toEqual([]);
  });

  it('treats empty component string as wildcard "*"', () => {
    roleService.get.mockReturnValue(
      of({
        ...role,
        roleServiceAccessByRoleId: [
          {
            id: 99,
            roleId: 12,
            serviceId: 3,
            component: '',
            verbMask: 1,
            requestorMask: 1,
          },
        ],
      })
    );
    loadFor(12);
    expect(component.allowedServices[0].rules[0].component).toBe('*');
  });

  it('shows an error when role fetch fails', () => {
    roleService.get.mockReturnValue(throwError(() => new Error('500')));
    loadFor(999);
    expect(component.error).toBe('Unable to load role.');
    expect(component.allowedServices).toEqual([]);
  });

  it('shows an error when service catalog fetch fails', () => {
    servicesService.getAll.mockReturnValue(throwError(() => new Error('500')));
    loadFor(12);
    expect(component.error).toBe('Unable to load service catalog.');
  });

  it('toggles the denied panel', () => {
    expect(component.expandedDenied).toBe(false);
    component.toggleDenied();
    expect(component.expandedDenied).toBe(true);
    component.toggleDenied();
    expect(component.expandedDenied).toBe(false);
  });

  it('hasRoleId reflects null/undefined/numeric values', () => {
    component.roleId = null;
    expect(component.hasRoleId).toBe(false);
    component.roleId = undefined;
    expect(component.hasRoleId).toBe(false);
    component.roleId = 0;
    expect(component.hasRoleId).toBe(true);
    component.roleId = 12;
    expect(component.hasRoleId).toBe(true);
  });

  it('skips access entries that reference an unknown service id', () => {
    roleService.get.mockReturnValue(
      of({
        ...role,
        roleServiceAccessByRoleId: [
          {
            id: 1,
            roleId: 12,
            serviceId: 9999,
            component: '*',
            verbMask: 1,
            requestorMask: 1,
          },
        ],
      })
    );
    loadFor(12);
    expect(component.allowedServices).toEqual([]);
  });
});
