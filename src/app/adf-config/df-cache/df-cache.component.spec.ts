import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfCacheComponent } from './df-cache.component';

describe('DfCacheComponent', () => {
  let component: DfCacheComponent;
  let fixture: ComponentFixture<DfCacheComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfCacheComponent],
    });
    fixture = TestBed.createComponent(DfCacheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
