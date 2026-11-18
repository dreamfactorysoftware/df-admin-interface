import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfSecretComponent } from './df-secret.component';
import { DfPresentationService } from '../../services/df-presentation.service';
import { MASK } from '../../utilities/mask';

const KEY = '6498a8ad1beb4f0e9c3d2a1b8f7e6d5c4b3a29180716253443526170819a0b1c';

describe('DfSecretComponent', () => {
  let fixture: ComponentFixture<DfSecretComponent>;
  let component: DfSecretComponent;
  let presentation: DfPresentationService;

  const rendered = () => fixture.nativeElement.textContent as string;
  const eye = () =>
    fixture.nativeElement.querySelector('[data-testid="secret-eye"]');

  beforeEach(async () => {
    localStorage.clear();
    document.body.className = '';
    await TestBed.configureTestingModule({
      imports: [DfSecretComponent],
    }).compileComponents();
    presentation = TestBed.inject(DfPresentationService);
    fixture = TestBed.createComponent(DfSecretComponent);
    component = fixture.componentInstance;
    component.value = KEY;
    fixture.detectChanges();
  });

  it('shows the real value while presentation mode is off', () => {
    expect(rendered()).toContain(KEY);
    expect(eye()).toBeNull();
  });

  it('hides the value — not just visually — once presentation mode is on', () => {
    presentation.set(true);
    fixture.detectChanges();
    expect(rendered()).not.toContain(KEY);
    expect(rendered()).toContain(MASK);
    // The point of the feature: the key is absent from the DOM, so it cannot
    // be read off a screenshare or recovered by selecting the text.
    expect(fixture.nativeElement.innerHTML).not.toContain(KEY);
  });

  it('offers an eye only while masking, and reveals on click', () => {
    presentation.set(true);
    fixture.detectChanges();
    expect(eye()).not.toBeNull();

    eye().click();
    fixture.detectChanges();
    expect(rendered()).toContain(KEY);

    eye().click();
    fixture.detectChanges();
    expect(rendered()).not.toContain(KEY);
  });

  it('re-hides a revealed field when presentation mode is switched on again', () => {
    presentation.set(true);
    fixture.detectChanges();
    eye().click();
    fixture.detectChanges();
    expect(rendered()).toContain(KEY);

    presentation.set(false);
    fixture.detectChanges();
    presentation.set(true);
    fixture.detectChanges();

    expect(component.revealed).toBe(false);
    expect(rendered()).not.toContain(KEY);
  });

  it('renders nothing for an absent value instead of a mask', () => {
    // setInput, not a bare assignment: the component is OnPush, and this is
    // how Angular delivers the binding in real use.
    fixture.componentRef.setInput('value', null);
    presentation.set(true);
    fixture.detectChanges();
    expect(rendered().trim()).toBe('');
  });

  it('stringifies a non-string value handed over by a table cell', () => {
    fixture.componentRef.setInput('value', 12345);
    fixture.detectChanges();
    expect(rendered()).toContain('12345');
  });

  it('stops the click from reaching a clickable table row', () => {
    presentation.set(true);
    fixture.detectChanges();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stop = jest.spyOn(event, 'stopPropagation');
    eye().dispatchEvent(event);
    fixture.detectChanges();
    expect(stop).toHaveBeenCalled();
    expect(component.revealed).toBe(true);
  });

  it('drops its subscription on destroy', () => {
    const sub = (component as unknown as { sub: { closed: boolean } }).sub;
    fixture.destroy();
    expect(sub.closed).toBe(true);
  });
});
