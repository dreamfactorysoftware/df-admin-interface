import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DfEmptyStateComponent } from './df-empty-state.component';

describe('DfEmptyStateComponent', () => {
  let component: DfEmptyStateComponent;
  let fixture: ComponentFixture<DfEmptyStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfEmptyStateComponent, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(DfEmptyStateComponent);
    component = fixture.componentInstance;
    component.icon = 'inbox';
    component.title = 'No services yet';
    component.description = 'Connect a datasource to generate its API.';
    component.actionLabel = 'Connect a datasource';
    fixture.detectChanges();
  });

  it('renders the title and helper copy passed in', () => {
    const title = fixture.debugElement.query(By.css('.empty-state__title'));
    const desc = fixture.debugElement.query(
      By.css('.empty-state__description')
    );

    expect(title.nativeElement.textContent.trim()).toBe('No services yet');
    expect(desc.nativeElement.textContent.trim()).toBe(
      'Connect a datasource to generate its API.'
    );
  });

  it('emits action on primary CTA click', () => {
    const spy = jest.fn();
    component.action.subscribe(spy);

    fixture.debugElement
      .query(By.css('[data-testid="empty-state-action"]'))
      .nativeElement.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('omits the action bar when no labels are set', () => {
    component.actionLabel = undefined;
    component.secondaryLabel = undefined;
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.empty-state__actions'))
    ).toBeNull();
  });
});
