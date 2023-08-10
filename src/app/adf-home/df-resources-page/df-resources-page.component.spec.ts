import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfResourcesPageComponent } from './df-resources-page.component';

describe('DfResourcesPageComponent', () => {
  let component: DfResourcesPageComponent;
  let fixture: ComponentFixture<DfResourcesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfResourcesPageComponent]
    });
    fixture = TestBed.createComponent(DfResourcesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
