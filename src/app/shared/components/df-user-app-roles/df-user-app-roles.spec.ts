import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfUserAppRolesComponent } from './df-user-app-roles.component';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
  ReactiveFormsModule,
  FormsModule,
  FormGroupDirective,
  FormGroup,
  FormArray,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AppType } from 'src/app/shared/types/apps';
import { RoleType } from '../../types/role';
import { NgIf, NgFor } from '@angular/common';

describe('DfUserAppRolesComponent', () => {
  let component: DfUserAppRolesComponent;
  let fixture: ComponentFixture<DfUserAppRolesComponent>;

  const mockFormGroupDirective = {
    control: new FormGroup({
      appRoles: new FormArray([]),
    }),
    ngSubmit: { subscribe: jest.fn() },
  };

  const mockApps: AppType[] = [
    {
      name: 'App1',
      id: 1,
      apiKey: 'testapikey1',
      description: 'App1 description',
      isActive: true,
      type: 1,
      requiresFullscreen: true,
      allowFullscreenToggle: true,
      toggleLocation: 'top',
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdById: 1,
      launchUrl: 'https://test.com',
    },
    {
      name: 'App2',
      id: 2,
      apiKey: 'testapikey2',
      description: 'App2 description',
      isActive: true,
      type: 1,
      requiresFullscreen: true,
      allowFullscreenToggle: true,
      toggleLocation: 'top',
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdById: 1,
      launchUrl: 'https://test.com',
    },
  ];

  const mockRoles: RoleType[] = [
    {
      name: 'Role1',
      description: 'role1 description',
      id: 1,
      isActive: true,
      createdById: 1,
      createdDate: new Date().toISOString(),
      lastModifiedById: 1,
      lastModifiedDate: new Date().toISOString(),
      lookupByRoleId: [1, 2],
    },
    {
      name: 'Role2',
      description: 'role2 description',
      id: 2,
      isActive: true,
      createdById: 1,
      createdDate: new Date().toISOString(),
      lastModifiedById: 1,
      lastModifiedDate: new Date().toISOString(),
      lookupByRoleId: [1, 2],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfUserAppRolesComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatInputModule,
        FontAwesomeModule,
        MatExpansionModule,
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
        NgIf,
        NgFor,
        { provide: FormGroupDirective, useValue: mockFormGroupDirective },
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
    fixture = TestBed.createComponent(DfUserAppRolesComponent);
    component = fixture.componentInstance;
    component.apps = mockApps;
    component.roles = mockRoles;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form and data source', () => {
    expect(component.rootForm).toBeDefined();
    expect(component.appRoles).toBeDefined();
    expect(component.dataSource).toBeDefined();
  });

  it('should add an app role to the form', () => {
    const initialLength = component.appRoles.length;

    component.add();

    expect(component.appRoles.length).toBe(initialLength + 1);
  });

  it('should remove an app role from the form', () => {
    component.add();
    const initialLength = component.appRoles.length;

    component.remove(0);

    expect(component.appRoles.length).toBe(initialLength - 1);
  });

  it('should update data source when adding or removing app roles', () => {
    const initialLength = component.appRoles.length;

    component.add();

    expect(component.dataSource.data.length).toBe(initialLength + 1);

    component.remove(0);

    expect(component.dataSource.data.length).toBe(initialLength);
  });
});
