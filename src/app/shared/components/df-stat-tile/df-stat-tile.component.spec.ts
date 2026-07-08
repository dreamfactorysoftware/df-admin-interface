import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DfStatTileComponent } from './df-stat-tile.component';

describe('DfStatTileComponent', () => {
  let component: DfStatTileComponent;
  let fixture: ComponentFixture<DfStatTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfStatTileComponent, RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DfStatTileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('derives direction from the sign of delta', () => {
    component.delta = 12;
    expect(component.direction).toBe('up');
    component.delta = -3;
    expect(component.direction).toBe('down');
    component.delta = 0;
    expect(component.direction).toBe('flat');
  });

  it('honours an explicit trend override', () => {
    component.delta = 12;
    component.trend = 'down';
    expect(component.direction).toBe('down');
  });

  it('reads an up delta as positive and inverts for cost-style tiles', () => {
    component.delta = 5;
    expect(component.deltaTone).toBe('positive');
    component.invertDelta = true;
    expect(component.deltaTone).toBe('negative');
  });

  it('shows delta magnitude without the sign (the icon carries it)', () => {
    component.delta = -7;
    expect(component.deltaDisplay).toBe('7%');
  });

  it('renders the value and eyebrow label', () => {
    component.label = 'Total APIs';
    component.value = 42;
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.df-stat-tile__label')?.textContent).toContain(
      'Total APIs'
    );
    expect(host.querySelector('.df-stat-tile__value')?.textContent).toContain(
      '42'
    );
  });
});
