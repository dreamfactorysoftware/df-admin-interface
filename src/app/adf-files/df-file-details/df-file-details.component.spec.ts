import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfFileDetailsComponent } from './df-file-details.component';

describe('DfFileDetailsComponent', () => {
  let component: DfFileDetailsComponent;
  let fixture: ComponentFixture<DfFileDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DfFileDetailsComponent]
    });
    fixture = TestBed.createComponent(DfFileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
