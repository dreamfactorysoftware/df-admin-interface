import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteAuthProvidersComponent } from './remote-auth-providers.component';

describe('RemoteAuthProvidersComponent', () => {
  let component: RemoteAuthProvidersComponent;
  let fixture: ComponentFixture<RemoteAuthProvidersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RemoteAuthProvidersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteAuthProvidersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
