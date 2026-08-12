import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfBadgeComponent } from './df-badge.component';

describe('DfBadgeComponent', () => {
  let component: DfBadgeComponent;
  let fixture: ComponentFixture<DfBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfBadgeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DfBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('maps the variant to a modifier class', () => {
    component.variant = 'success';
    expect(component.variantClass).toBe('df-badge--success');
  });

  it('renders the label and the dot by default', () => {
    component.label = 'Active';
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.df-badge__label')?.textContent).toContain(
      'Active'
    );
    expect(host.querySelector('.df-badge__dot')).toBeTruthy();
  });

  it('hides the dot when dot is false', () => {
    component.dot = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.df-badge__dot')).toBeNull();
  });
});
