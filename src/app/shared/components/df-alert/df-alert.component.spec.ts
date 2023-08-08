import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfAlertComponent, AlertType } from './df-alert.component';

describe('DfAlertComponent', () => {
  let component: DfAlertComponent;
  let fixture: ComponentFixture<DfAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DfAlertComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DfAlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the message', () => {
    const message = 'This is a test message';
    component.message = message;
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('.message');
    expect(element.textContent).toContain(message);
  });

  it('should display the correct icon for the alert type', () => {
    const alertType: AlertType = 'error';
    component.alertType = alertType;
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('.icon');
    expect(element.textContent).toContain('error');
  });

  it('should emit the alertClosed event when the alert is dismissed', () => {
    const spy = jest.spyOn(component.alertClosed, 'emit');
    component.showAlert = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.dismiss');
    button.click();

    expect(spy).toHaveBeenCalled();
  });
});
