import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfAlertComponent, AlertType } from './df-alert.component';

describe('DfAlertComponent', () => {
  let component: DfAlertComponent;
  let fixture: ComponentFixture<DfAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfAlertComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DfAlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct icon for the alert type', () => {
    const alertType: AlertType = 'error';
    component.alertType = alertType;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      const element = fixture.nativeElement.querySelector('.alert-icon');
      expect(element.textContent).toContain('error');
    });
  });

  it('should emit the alertClosed event when the alert is dismissed', () => {
    const spy = jest.spyOn(component.alertClosed, 'emit');
    component.showAlert = true;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      const button = fixture.nativeElement.querySelector('.dismiss-alert');
      button.click();
      expect(spy).toHaveBeenCalled();
    });
  });
});
