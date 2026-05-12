import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { DfAiChatPrereqsComponent } from './df-ai-chat-prereqs.component';

describe('DfAiChatPrereqsComponent', () => {
  let fixture: ComponentFixture<DfAiChatPrereqsComponent>;
  let component: DfAiChatPrereqsComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAiChatPrereqsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(DfAiChatPrereqsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushBoth(
    connections: Array<{ id: number; name: string; label?: string }> = [],
    roles: Array<{ id: number; name: string }> = []
  ) {
    fixture.detectChanges(); // triggers ngOnInit + the two requests
    const reqs = http.match(r => r.url.startsWith('/api/v2/system/'));
    const conn = reqs.find(r => r.request.url === '/api/v2/system/service');
    const role = reqs.find(r => r.request.url === '/api/v2/system/role');
    conn!.flush({ resource: connections });
    role!.flush({ resource: roles });
  }

  it('starts in loading state', () => {
    expect(component.loading).toBe(true);
  });

  it('populates connections + roles from the two endpoints', () => {
    flushBoth(
      [{ id: 3, name: 'anthropic_main', label: 'Anthropic' }],
      [{ id: 12, name: 'testing_scoped_role' }]
    );
    expect(component.loading).toBe(false);
    expect(component.connections.length).toBe(1);
    expect(component.roles.length).toBe(1);
  });

  it('handles request failures by treating each as empty', () => {
    fixture.detectChanges();
    const reqs = http.match(() => true);
    reqs.forEach(r =>
      r.error(new ProgressEvent('error'), { status: 500, statusText: 'err' })
    );
    expect(component.connections).toEqual([]);
    expect(component.roles).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('emits selectConnection on chip click', () => {
    flushBoth([{ id: 3, name: 'anthropic' }], []);
    const spy = jest.fn();
    component.selectConnection.subscribe(spy);
    component.selectConnection.emit(3);
    expect(spy).toHaveBeenCalledWith(3);
  });

  it('emits selectRole on chip click', () => {
    flushBoth([], [{ id: 12, name: 'testing_scoped_role' }]);
    const spy = jest.fn();
    component.selectRole.subscribe(spy);
    component.selectRole.emit(12);
    expect(spy).toHaveBeenCalledWith(12);
  });

  it('reflects @Input selectedConnectionId/selectedRoleId', () => {
    component.selectedConnectionId = 5;
    component.selectedRoleId = 12;
    expect(component.selectedConnectionId).toBe(5);
    expect(component.selectedRoleId).toBe(12);
  });
});
