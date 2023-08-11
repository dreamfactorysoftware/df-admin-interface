import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfServiceFormComponent } from './df-service-form.component';
import { MatDialogModule } from '@angular/material/dialog';

describe('DfServiceDialogComponent', () => {
  let component: DfServiceFormComponent;
  let fixture: ComponentFixture<DfServiceFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfServiceFormComponent],
      imports: [MatDialogModule],
    });
    fixture = TestBed.createComponent(DfServiceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
