/**
 * Access section + editor tests: the role list join, one-click Grant, the
 * editor's allow_writes block, table limits, and create-with-key feeding the
 * store key that Connect snippets fill.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfMcpAccessApiService, McpRole } from '../mcp-access-api.service';
import { McpBackendService } from '../mcp-effective';
import { McpEditorStore } from '../mcp-store';
import {
  DfMcpAccessEditorComponent,
  McpAccessEditorData,
} from './df-mcp-access-editor.component';
import {
  DfMcpAccessComponent,
  buildAccessRows,
} from './df-mcp-access.component';

const SERVER_ID = 15;
const backends: McpBackendService[] = [
  { id: 50, name: 'crm', label: 'CRM', kind: 'db', active: true },
  { id: 51, name: 'files', label: 'Files', kind: 'file', active: true },
];

function makeStore(rest: Record<string, any> = {}): McpEditorStore {
  const store = new McpEditorStore();
  store.init(
    {
      id: SERVER_ID,
      name: 'warehouse',
      label: 'Warehouse',
      description: '',
      isActive: true,
      type: 'mcp',
      raw: {},
    },
    { exposed_services: ['crm', 'files'], ...rest }
  );
  store.backendServices = backends;
  return store;
}

const role = (
  id: number,
  name: string,
  rows: McpRole['rows'] = []
): McpRole => ({
  id,
  name,
  isActive: true,
  rows,
});

function apiStub() {
  return {
    access: jest.fn(() => of(null)),
    roles: jest.fn(() => of([])),
    apps: jest.fn(() => of([])),
    listTables: jest.fn(() => of(['orders', 'customers'])),
    patchRoleAccess: jest.fn(() => of({})),
    createRole: jest.fn(() => of(77)),
    createAppKey: jest.fn(() => of('k3y')),
  };
}

describe('buildAccessRows', () => {
  it('lists mcp-access roles plus roles holding a server grant, granted first', () => {
    const rows = buildAccessRows(
      SERVER_ID,
      {
        service_id: SERVER_ID,
        service: 'warehouse',
        require_role_access: true,
        roles: [
          {
            role_id: 1,
            name: 'seen',
            granted: false,
            requests: 9,
            denied: 9,
            last_seen: null,
          },
          {
            role_id: 2,
            name: 'analyst',
            granted: true,
            requests: 3,
            denied: 0,
            last_seen: null,
          },
        ],
      },
      [
        role(3, 'granted_quiet', [
          { serviceId: SERVER_ID, component: '*', verbMask: 1 },
        ]),
        role(4, 'unrelated', [{ serviceId: 50, component: '*', verbMask: 1 }]),
      ],
      [{ id: 5, name: 'analyst_app', roleId: 2 }]
    );
    expect(rows.map(r => [r.name, r.granted])).toEqual([
      ['analyst', true],
      ['granted_quiet', true],
      ['seen', false],
    ]);
    expect(rows[0].keyName).toBe('analyst_app');
  });
});

describe('DfMcpAccessComponent', () => {
  let fixture: ComponentFixture<DfMcpAccessComponent>;
  let api: ReturnType<typeof apiStub>;
  const snackbar = { openSnackBar: jest.fn() };

  beforeEach(async () => {
    api = apiStub();
    await TestBed.configureTestingModule({
      imports: [DfMcpAccessComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: DfMcpAccessApiService, useValue: api },
        { provide: DfSnackbarService, useValue: snackbar },
      ],
    }).compileComponents();
  });

  function render(store: McpEditorStore): DfMcpAccessComponent {
    fixture = TestBed.createComponent(DfMcpAccessComponent);
    fixture.componentInstance.store = store;
    fixture.componentInstance.ngOnChanges({ store: {} as any });
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('warns when require_role_access is off and grants a seen role in one click', () => {
    api.access.mockReturnValue(
      of({
        service_id: SERVER_ID,
        service: 'warehouse',
        require_role_access: false,
        roles: [
          {
            role_id: 1,
            name: 'seen',
            granted: false,
            requests: 2,
            denied: 2,
            last_seen: null,
          },
        ],
      }) as any
    );
    api.roles.mockReturnValue(of([role(1, 'seen')]) as any);
    render(makeStore());
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-testid="mcp-access-open"]')).toBeTruthy();
    (
      el.querySelector('[data-testid="mcp-access-grant"]') as HTMLButtonElement
    ).click();
    expect(api.patchRoleAccess).toHaveBeenCalledWith(1, [
      expect.objectContaining({
        service_id: SERVER_ID,
        component: '*',
        verb_mask: 1,
      }),
    ]);
  });

  it('only offers exposed services that carry an id to the editor', () => {
    const store = makeStore();
    store.backendServices = [
      ...backends,
      { name: 'noid', label: 'x', kind: 'db', active: true },
    ];
    store.cfg.exposedServices.push('noid');
    const cmp = render(store);
    expect(cmp.backends().map(b => b.name)).toEqual(['crm', 'files']);
  });
});

describe('DfMcpAccessEditorComponent', () => {
  let api: ReturnType<typeof apiStub>;
  const dialogRef = { close: jest.fn() };

  async function make(data: Partial<McpAccessEditorData>, store = makeStore()) {
    api = apiStub();
    dialogRef.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [DfMcpAccessEditorComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: DfMcpAccessApiService, useValue: api },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            store,
            mode: 'create',
            backends,
            allowWrites: true,
            roles: [],
            grantedIds: new Set<number>(),
            ...data,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DfMcpAccessEditorComponent);
    fixture.detectChanges();
    return { fixture, cmp: fixture.componentInstance, store };
  }

  const row = (cmp: DfMcpAccessEditorComponent, name: string) =>
    cmp.groups.flatMap(g => g.rows).find(r => r.svc.name === name)!;

  it('creates the role with the server grant and a key, then hands the key to Connect', async () => {
    const { cmp, store, fixture } = await make({});
    expect(cmp.name).toBe('warehouse_access');
    cmp.setLevel(row(cmp, 'crm'), 'read');
    cmp.createKey = true;
    expect(cmp.summaryText).toContain('grants this MCP server');
    cmp.save();
    expect(api.createRole).toHaveBeenCalledWith(
      'warehouse_access',
      expect.any(String),
      [
        expect.objectContaining({ service_id: SERVER_ID, verb_mask: 1 }),
        expect.objectContaining({
          service_id: 50,
          component: '*',
          verb_mask: 1,
        }),
      ]
    );
    expect(api.createAppKey).toHaveBeenCalledWith('warehouse_access_app', 77);
    expect(store.createdApiKey).toBe('k3y');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="mcp-access-key"]')
        .textContent
    ).toContain('k3y');
    expect(dialogRef.close).not.toHaveBeenCalled(); // key screen first
  });

  it('blocks read-write when the server blocks writes', async () => {
    const { cmp, fixture } = await make({ allowWrites: false });
    cmp.setLevel(row(cmp, 'crm'), 'rw');
    expect(cmp.levels[50]).toBe('none');
    fixture.detectChanges();
    const rw = fixture.nativeElement.querySelector(
      '[data-backend="crm"] [data-level="rw"]'
    ) as HTMLButtonElement;
    expect(rw.disabled).toBe(true);
  });

  it('limits a database to ticked tables, loading the table list lazily', async () => {
    const { cmp } = await make({});
    const crm = row(cmp, 'crm');
    cmp.setLevel(crm, 'read');
    cmp.toggleExpanded(crm);
    expect(api.listTables).toHaveBeenCalledWith('crm');
    cmp.toggleTable(crm, 'orders');
    expect(cmp.limitLabel(crm)).toBe('1 of 2 tables');
    expect(cmp.summaryText).toContain('read on 1 API');
    expect(cmp.summaryText).toContain('table listing');
    cmp.save();
    expect((api.createRole.mock.calls[0] as unknown[])[2]).toEqual([
      expect.objectContaining({ service_id: SERVER_ID, component: '*' }),
      expect.objectContaining({
        service_id: 50,
        component: '_table/orders/*',
        verb_mask: 1,
      }),
      expect.objectContaining({
        service_id: 50,
        component: '_table/',
        verb_mask: 1,
      }),
    ]);
  });

  it('edit mode patches only the diff and closes on save', async () => {
    const r = role(3, 'analyst', [
      { id: 1, serviceId: SERVER_ID, component: '*', verbMask: 1 },
      { id: 2, serviceId: 50, component: '*', verbMask: 1 },
    ]);
    const { cmp } = await make({ mode: 'edit', role: r, roles: [r] });
    expect(cmp.levels[50]).toBe('read');
    expect(cmp.canSave).toBe(false);
    cmp.setLevel(row(cmp, 'crm'), 'none');
    cmp.save();
    expect(api.patchRoleAccess).toHaveBeenCalledWith(3, [
      { id: 2, role_id: null },
    ]);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('add mode locks rows until a role is picked and hides granted roles', async () => {
    const roles = [role(1, 'granted'), role(2, 'free')];
    const { cmp } = await make({
      mode: 'add',
      roles,
      grantedIds: new Set([1]),
    });
    expect(cmp.addableRoles.map(r => r.name)).toEqual(['free']);
    expect(cmp.canSave).toBe(false);
    cmp.setLevel(row(cmp, 'crm'), 'read');
    expect(cmp.levels[50]).toBe('none');
    cmp.onRolePicked(2);
    expect(cmp.canSave).toBe(true); // the server grant alone is a change
  });
});
