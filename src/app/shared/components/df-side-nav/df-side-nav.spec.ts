import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSideNavComponent } from './df-side-nav.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ROUTES } from '../../types/routes';

describe('DfSideNavComponent', () => {
  let component: DfSideNavComponent;
  let fixture: ComponentFixture<DfSideNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfSideNavComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: {
              pipe: () => {
                return {
                  subscribe: (fn: (value: any) => void) => fn({}),
                };
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return true when isActive() is called with a matching route', () => {
    const nav = { path: '/test', route: 'test' as ROUTES };
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'url', 'get').mockReturnValue('/test/123');
    expect(component.isActive(nav)).toBe(true);
  });

  it('should return false when isActive() is called with a non-matching route', () => {
    const nav = { path: '/test', route: 'test' as ROUTES };
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'url', 'get').mockReturnValue('/other');
    expect(component.isActive(nav)).toBe(false);
  });

  it('should return the expected nav label when navLabel() is called', () => {
    const label = component.navLabel('/test/123');
    expect(label).toBe('nav.test.123.nav');
  });
});
