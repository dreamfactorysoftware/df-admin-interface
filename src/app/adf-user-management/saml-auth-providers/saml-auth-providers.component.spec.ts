import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SAMLAuthProvidersComponent } from './saml-auth-providers.component';

describe('SAMLAuthProvidersComponent', () => {
  let component: SAMLAuthProvidersComponent;
  let fixture: ComponentFixture<SAMLAuthProvidersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SAMLAuthProvidersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SAMLAuthProvidersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
