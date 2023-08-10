import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfResourcesPageComponent } from './df-resources-page.component';

describe('DfResourcesPageComponent', () => {
  let component: DfResourcesPageComponent;
  let fixture: ComponentFixture<DfResourcesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
<<<<<<< HEAD
      declarations: [DfResourcesPageComponent],
=======
      declarations: [DfResourcesPageComponent]
>>>>>>> 417903b (Adds new home module and home pages content. Moves existing home page components into new modulel)
    });
    fixture = TestBed.createComponent(DfResourcesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
