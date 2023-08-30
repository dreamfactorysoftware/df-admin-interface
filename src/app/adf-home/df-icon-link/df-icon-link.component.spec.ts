import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfIconLinkComponent } from './df-icon-link.component';

describe('DfIconLinkComponent', () => {
  let component: DfIconLinkComponent;
  let fixture: ComponentFixture<DfIconLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfIconLinkComponent],
    });
    fixture = TestBed.createComponent(DfIconLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
