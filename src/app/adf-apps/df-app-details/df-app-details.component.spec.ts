import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfAppDetailsComponent } from './df-app-details.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from '../../../transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Validators } from '@angular/forms';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { EDIT_DATA, ROLES } from './df-app-details.mock';
import { of } from 'rxjs';

describe('DfAppDetailsComponent - Create', () => {
  let component: DfAppDetailsComponent;
  let fixture: ComponentFixture<DfAppDetailsComponent>;
  // let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAppDetailsComponent,
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
            data: of({
              roles: {
                resource: [...ROLES],
              },
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfAppDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get error on invalid form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');
    component.appForm.controls['name'].setValue('');
    expect(component.appForm.valid).toBeFalsy();
    expect(crudServiceSpy).not.toHaveBeenCalled();
  });

  it('should return valid form', () => {
    component.appForm.controls['name'].setValue('test');
    expect(component.appForm.valid).toBeTruthy();
  });

  it('should update path control validity', () => {
    component.appForm.controls['appLocation'].setValue('3');

    expect(
      component.appForm.controls['path'].hasValidator(Validators.required)
    ).toEqual(true);
  });

  it('should update url control validity', () => {
    component.appForm.controls['appLocation'].setValue('2');

    expect(
      component.appForm.controls['url'].hasValidator(Validators.required)
    ).toEqual(true);
  });

  it('should successfully submit valid create form', () => {
    const crudServiceSpy = jest.spyOn(DfBaseCrudService.prototype, 'create');

    component.appForm.controls['name'].setValue('test');
    component.save();

    expect(component.appForm.valid).toBeTruthy();
    expect(crudServiceSpy).toHaveBeenCalled();
  });
});

describe('DfAppDetailsComponent - Edit', () => {
  let component: DfAppDetailsComponent;
  let fixture: ComponentFixture<DfAppDetailsComponent>;
  // let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAppDetailsComponent,
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
            data: of({
              roles: {
                resource: [...ROLES],
              },
              appData: EDIT_DATA,
            }),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(DfAppDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should successfully populate form with edit data', () => {
    const appFormPopulated = {
      name: EDIT_DATA.name,
      description: EDIT_DATA.description,
      defaultRole: EDIT_DATA.roleByRoleId,
      active: EDIT_DATA.isActive,
      appLocation: EDIT_DATA.type.toString(),
      storageServiceId: EDIT_DATA.storageServiceId,
      storageContainer: EDIT_DATA.storageContainer,
      path: EDIT_DATA.path,
      url: EDIT_DATA.url,
    };

    expect(component.appForm.value).toEqual(appFormPopulated);
    expect(component.appForm.valid).toBeTruthy();
  });
});
