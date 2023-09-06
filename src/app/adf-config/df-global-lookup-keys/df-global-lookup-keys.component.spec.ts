import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfGlobalLookupKeysComponent } from './df-global-lookup-keys.component';

describe('DfGlobalLookupKeysComponent', () => {
  let component: DfGlobalLookupKeysComponent;
  let fixture: ComponentFixture<DfGlobalLookupKeysComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfGlobalLookupKeysComponent],
    });
    fixture = TestBed.createComponent(DfGlobalLookupKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
