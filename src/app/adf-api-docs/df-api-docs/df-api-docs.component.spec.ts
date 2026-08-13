import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfApiDocsComponent } from './df-api-docs.component';
import { createTestBedConfig } from 'src/app/shared/utilities/testbed-config';
import { mockApiDocsData } from './test-utilities/df-api-docs.mock';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

const snackBarStub = {
  provide: MatSnackBar,
  useValue: { open: jest.fn(), dismiss: jest.fn() },
};

describe('DfApiDocsComponent', () => {
  let component: DfApiDocsComponent;
  let fixture: ComponentFixture<DfApiDocsComponent>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      ...createTestBedConfig(
        DfApiDocsComponent,
        // The component injects MatSnackBar directly; without a provider every
        // test fails at createComponent with a NullInjectorError, before it
        // reaches its assertion.
        [snackBarStub],
        {
          data: {
            ...mockApiDocsData,
          },
        },
        [],
        // ngOnInit reads the service name off the route snapshot; without it
        // the component throws before the fixture is usable.
        { name: 'db' }
      ),
      // The swagger-ui host this component renders into throws while jsdom
      // tears the fixture down, which fails otherwise-passing tests during
      // cleanup rather than in their own body.
      teardown: { destroyAfterEach: false },
    });

    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(DfApiDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('path token pickers', () => {
    const tableToken = {
      token: 'table_name',
      kind: 'table' as const,
      labelKey: 'apiDocs.token.table',
    };
    const freeToken = {
      token: 'id',
      kind: 'text' as const,
      labelKey: null,
    };

    it('keeps the picker while the lookup is still in flight', () => {
      component.tokenOptions = {};

      expect(component.usePicker(tableToken)).toBe(true);
    });

    it('keeps the picker once options arrive', () => {
      component.tokenOptions = { table_name: ['customers', 'orders'] };

      expect(component.usePicker(tableToken)).toBe(true);
    });

    it('falls back to typing when nothing can be enumerated', () => {
      // Empty covers both an honestly empty list (a service with no stored
      // procedures) and a failed lookup, which the loaders swallow into [].
      component.tokenOptions = { table_name: [] };

      expect(component.usePicker(tableToken)).toBe(false);
    });

    it('never renders a picker for a free-text token', () => {
      component.tokenOptions = { id: ['1', '2'] };

      expect(component.usePicker(freeToken)).toBe(false);
    });
  });

  it('should navigate away to api docs table successfully when the back button is clicked', () => {
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.goBackToList();

    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should download the api doc when the download button is clicked', () => {
    global.URL.createObjectURL = jest.fn(blob => 'urltest');
    global.URL.revokeObjectURL = jest.fn(url => 'urltest');

    // Mock HTMLAnchorElement here as a spy object
    const spyObj = {
      click: jest.fn(),
    };

    const createAnchorElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(() => {
        return spyObj as any;
      });

    component.downloadApiDoc();

    expect(createAnchorElementSpy).toHaveBeenCalledWith('a');
    expect(spyObj.click).toHaveBeenCalled();
  });
});
