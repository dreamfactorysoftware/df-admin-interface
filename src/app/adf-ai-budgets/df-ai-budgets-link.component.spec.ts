import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { BehaviorSubject, of } from 'rxjs';
import { AiBudgetsAvailabilityService } from './ai-budgets-availability.service';
import { DfAiBudgetsLinkComponent } from './df-ai-budgets-link.component';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

describe('DfAiBudgetsLinkComponent', () => {
  let fixture: ComponentFixture<DfAiBudgetsLinkComponent>;
  let available$: BehaviorSubject<boolean>;

  const link = () =>
    fixture.nativeElement.querySelector(
      '[data-testid="manage-budgets"]'
    ) as HTMLAnchorElement | null;

  beforeEach(() => {
    available$ = new BehaviorSubject<boolean>(false);
    TestBed.configureTestingModule({
      imports: [DfAiBudgetsLinkComponent],
      providers: [
        provideRouter([]),
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        { provide: AiBudgetsAvailabilityService, useValue: { available$ } },
      ],
    });
    fixture = TestBed.createComponent(DfAiBudgetsLinkComponent);
    fixture.detectChanges();
  });

  it('renders nothing until the server is known to have budgets', () => {
    expect(link()).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('links to the Budgets page once it is', () => {
    available$.next(true);
    fixture.detectChanges();
    expect(link()?.textContent).toContain('Manage budgets');
    expect(link()?.getAttribute('href')).toBe('/ai/budgets');
  });

  it('goes away again when access is lost', () => {
    available$.next(true);
    fixture.detectChanges();
    available$.next(false);
    fixture.detectChanges();
    expect(link()).toBeNull();
  });
});
