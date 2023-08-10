import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfResourcesPageComponent } from './df-resources-page.component';

describe('DfResourcesPageComponent', () => {
  let component: DfResourcesPageComponent;
  let fixture: ComponentFixture<DfResourcesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
<<<<<<< HEAD
<<<<<<< HEAD
      declarations: [DfResourcesPageComponent],
=======
      declarations: [DfResourcesPageComponent]
>>>>>>> 417903b (Adds new home module and home pages content. Moves existing home page components into new modulel)
=======
      declarations: [DfResourcesPageComponent],
>>>>>>> be782b3 (Adds home module to house home tab content pages and custom components)
    });
    fixture = TestBed.createComponent(DfResourcesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
