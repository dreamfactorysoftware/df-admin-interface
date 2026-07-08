import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSkeletonComponent } from './df-skeleton.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('DfSkeletonComponent', () => {
  let component: DfSkeletonComponent;
  let fixture: ComponentFixture<DfSkeletonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfSkeletonComponent, HttpClientTestingModule],
      providers: [
        provideTransloco({
          config: {
            defaultLang: 'en',
            availableLangs: ['en'],
          },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
      ],
    });
    fixture = TestBed.createComponent(DfSkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to a single line variant', () => {
    expect(component.variant).toEqual('line');
    expect(component.items.length).toEqual(1);
  });

  it('repeats units for count', () => {
    component.count = 4;
    expect(component.items).toEqual([0, 1, 2, 3]);
  });

  it('clamps a non-positive count to one unit', () => {
    component.count = 0;
    expect(component.items.length).toEqual(1);
    component.count = -3;
    expect(component.items.length).toEqual(1);
  });

  it('renders a status region with a busy flag', () => {
    const region: HTMLElement =
      fixture.nativeElement.querySelector('.df-skeleton');
    expect(region.getAttribute('role')).toEqual('status');
    expect(region.getAttribute('aria-busy')).toEqual('true');
  });
});
