import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfSnackbarComponent } from './df-snackbar.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faXmark,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';

describe('DfSnackbarComponent', () => {
  let component: DfSnackbarComponent;
  let fixture: ComponentFixture<DfSnackbarComponent>;
  let loader: HarnessLoader;
  let snackBarRefMock: MatSnackBarRef<DfSnackbarComponent>;

  const mockSnackBarData = {
    message: 'Test message',
    alertType: '',
  };

  beforeEach(() => {
    snackBarRefMock = {
      dismissWithAction: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      imports: [
        DfSnackbarComponent,
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
        {
          provide: MatSnackBarRef,
          useValue: snackBarRefMock,
        },
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: mockSnackBarData,
        },
      ],
    });
    fixture = TestBed.createComponent(DfSnackbarComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize message and alertType from MAT_SNACK_BAR_DATA', () => {
    expect(component.message).toEqual(mockSnackBarData.message);
    expect(component.alertType).toEqual(mockSnackBarData.alertType);
  });

  it('should set the correct icon based on alertType', () => {
    expect(component.icon).toEqual(faInfoCircle);
    component.alertType = 'error';
    expect(component.icon).toEqual(faXmarkCircle);
    component.alertType = 'warning';
    expect(component.icon).toEqual(faExclamationCircle);
    component.alertType = 'info';
    expect(component.icon).toEqual(faInfoCircle);
    component.alertType = 'success';
    expect(component.icon).toEqual(faCheckCircle);
  });

  it('should call dismissWithAction onAction', () => {
    component.onAction();
    expect(snackBarRefMock.dismissWithAction).toHaveBeenCalled();
  });
});
